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
      },
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [
            -5.785443,
            -15.9587411
          ]
        }
      }
    ]
  };
}

function matchItem(storedItems, itemTest) {
  let match = false;
  storedItems.forEach(item => {
    match = match || (item.pubDate[0] === itemTest.pubDate[0]);
  });
  return match;
}

function updateItems(items) {
  let storedItems;
  try {
    storedItems = JSON.parse(fs.readFileSync('items.json'));
  } catch {
    storedItems = [];
  }
  items.forEach(item => {
    if (!matchItem(storedItems, item)) {
      storedItems.push(item);
    }
  });
  fs.writeFileSync('items.json', JSON.stringify(storedItems, null, 2));
  return storedItems;
}

function sortItems(item1, item2) {
  var d1 = new Date(item1.pubDate[0]);
  var d2 = new Date(item2.pubDate[0]);
  return d1 - d2;
}

function process(xml) {
  parser.parseString(xml, (error, result) => {
    if (error === null) {
      const items = _.filter(result.rss.channel[0].item, (i) => { return i.title[0] === itemTitle; });
      const allItems = updateItems(items).sort(sortItems);
      const coords = _.map(allItems, coordinate);
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