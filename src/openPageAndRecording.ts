const Xvfb = require('xvfb');
import puppeteer from 'puppeteer';

const process = require('process');

const ffmpeg = require('js-ffmpeg');

const DISPLAY = 99;

export async function openPageAndRecording(url: string): Promise<void> {
  const xvfb = new Xvfb({displayNum: DISPLAY,
    // if argument contains spaces, we have to split them into multiple items
    // ['-screen', '0 1024x768x16'] ---> ['-screen', '0', '1024x768x16']
    // https://stackoverflow.com/questions/10941545/nodejs-child-process-spawn-does-not-work-when-one-of-the-args-has-a-space-in-it
    xvfb_args: ['-screen', '0', '1024x768x16']});
  xvfb.startSync();

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    executablePath: process.env.CHROMIUM_PATH,
    defaultViewport: {
      width: 1024,
      height: 768,
    },
  });

  const page = await browser.newPage();
  await page.goto(url);


  await page.waitForTimeout(2000);

  // not sure how to force the video autoplay, so I need to click on the "play" button
  // manually
  const playButton = await page.$('.ytp-play-button')
  await playButton?.click()

  ffmpeg.ffmpeg([], [
    '-f', 'x11grab',
    '-video_size', '1024x768',
    '-framerate', '60',
    // we have to put the `-i` after `-f`, otherwise ffmpeg will try to handle it as an invalid file,
    // and report error: ':99.0: Protocol not found, did you mean file::99.0?'
    '-i', `:${DISPLAY}.0`,
    '-t', '30' // 30s
  ], '/output/video.mp4', (progress: any) => {
    console.log(progress);
  }).success((json: any) => {
    console.log(json);
    xvfb.stopSync();
    browser.close();
  }).error((error: any) => {
    console.error(error)
  })

}
