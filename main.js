const https = require('https');
const xml2js = require('xml2js');
const _ = require('underscore');
const fs = require('fs');

const parser = new xml2js.Parser({ attrkey: "ATTR" });
const url = 'https://groups.google.com/forum/feed/spectrum-hby5404-tracking/msgs/rss_v2_0.xml?num=100';
const itemTitle = 'SMS from 881631...@msg.iridium.com';

function coordinate(item) {
  const descr = item.description[0];
  const lat = Number(descr.match(/Lat[^\s]+/)[0].substr(3));
  const lon = Number(descr.match(/Lon[^\s]+/)[0].substr(3));
  return [lon, lat];
}

function geo(coordinates) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    ]
  };
}

function process(xml) {
  parser.parseString(xml, (error, result) => {
    if (error === null) {
      const items = _.filter(result.rss.channel[0].item, (i) => { return i.title[0] === itemTitle; });
      const coords = _.map(items, coordinate).reverse();
      fs.writeFileSync('eg-route.json', JSON.stringify(geo(coords), null, 2));
    } else {
      console.log(error);
    }
  })
}

https.get(url, (resp) => {
  let xml = '';
  resp.on('data', (chunk) => {
    xml += chunk;
  });

  resp.on('end', () => {
    process(xml);
  })
});