const Alexa = require('alexa-sdk');

const request = require('superagent');
const cheerio = require('cheerio');

function getHtml(comicNumber) {
  return new Promise((resolve, reject) => {
    request
      .get('http://www.explainxkcd.com/wiki/api.php')
      .query({
        format: 'json',
        redirects: 1,
        action: 'parse',
        prop: 'text',
        page: comicNumber
      })
      .end((err, res) => {
        if (err) reject(err);
        else {
          const text = res.body.parse.text['*'];
          resolve(text);
        }
      });
  });
}

function getCheerio(comicNumber) {
  return getHtml(comicNumber).then(text => cheerio.load(text));
}

function getTextExplanation(comicNumber) {
  return getCheerio(comicNumber).then(($) => {
    // First paragraph that comes after the first h2 (which is the 'Explanation' h2)
    const p1 = $('h2').first().nextAll('p').first();
    // All the p elements that directly follow p1
    const paragraphs = p1
      .nextUntil(p1.nextAll(':not(p)').first()) // Elements until the first non-p element
      .addBack();                               // Including the first one
    return paragraphs.text();
  });
}

exports.handler = (event, context, callback) => {
  const alexa = Alexa.handler(event, context);
  // Register request handlers
  alexa.registerHandlers({
    ExplainIntent() {
      // Get value of number slot
      const num = this.event.request.intent.slots.number.value;
      // Speak the explanation
      getTextExplanation(num).then((explanation) => this.emit(':tell', explanation));
    },
  });
  alexa.execute();
};
