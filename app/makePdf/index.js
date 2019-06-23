const fs = require('fs');
const puppeteer = require('puppeteer');

exports.default = makePdf;
exports.generatePDF = generatePDF;

async function makePdf () {
  console.log('Making PDF.');

  // Requires more memory than a stream, but obtains whole file asynchronously.
  // TODO: instead of readFile, put html into an exported string variable?
  fs.readFile(
    './src/pdf/index.html',
    {encoding: 'utf8'},
    async (error, data) => {
      if (error) {
        console.error('readFile: ' + error);

        throw new Error(error);
      }

      const pdf = await generatePDF(html, {DEBUG_MODE: true});

      fs.writeFile('../output/pdf2.pdf', pdf, (error) => {
        if (error) {
          console.error('writeFile: ' + error);

          throw new Error(error);
        }
      });
    }
  );
}

async function generatePDF (html, options = {}) {
  const defaultOptions = {
    DEBUG_MODE: false, // true throws an error
    emulateScreenMedia: false,
    ignoreHttpsErrors: false,
    setContent: {
      waitUntil: 'networkidle0',
    },
    pdf: {
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
    },
    failEarly: false,
  };

  options = {
    ...defaultOptions,
    options,
  };

  let pdf;
  let failedResponses = [];

  const browser = await puppeteer.launch({
    headless: !options.DEBUG_MODE,
    sloMo: options.DEBUG_MODE ? 250 : undefined,
    ignoreHTTPSErrors: options.ignoreHttpsErrors,
    args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  page.on('error', error => {
    console.error(`Error event emitted: ${err}`);
    console.error(error.stack);

    browser.close();
  });

  page.on('requestfailed', request => {
    failedResponses.push(request);
  });

  page.on('response', response => {
    if (response.status >= 400) {
      failedResponses.push(response);
    }
  });

  try {
    // Set the page content.
    await page.setContent(html, options.setContent);

    if (failedResponses.length) {
      console.warn(`Number of failed requests: ${failedResponses.length}`);

      failedResponses.forEach(response => console.warn(`${response.status} ${response.url}`));

      if (options.failEarly === 'all') {
        const error = new Error(
          `${failedResponses.length} requests have failed. See server log for more details.`
        );

        error.status = 412;

        throw error;
      }
    }

    pdf = await page.pdf(options.pdf);
  }
  catch (error) {
    console.error(`Error when rendering page: ${error}`);

    throw new Error(error);
  }
  finally {
    // Close the browser.
    await browser.close();
  }

  return pdf;
};
