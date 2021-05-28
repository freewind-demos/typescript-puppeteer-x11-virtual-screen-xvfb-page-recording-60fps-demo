const Xvfb = require('xvfb');
import puppeteer from 'puppeteer';

const process = require('process');

const ffmpeg = require('js-ffmpeg');

let displaySeed = 100;

function nextDisplay(): number {
  displaySeed += 1;
  return displaySeed;
}

export async function openPageAndRecording(url: string): Promise<void> {
  const displayNumber = nextDisplay();

  // FIXME not work?
  process.env.DISPLAY = displayNumber;

  const xvfb = new Xvfb({
    displayNum: displayNumber,
    // if argument contains spaces, we have to split them into multiple items
    // ['-screen', '0 1024x768x16'] ---> ['-screen', '0', '1024x768x16']
    // https://stackoverflow.com/questions/10941545/nodejs-child-process-spawn-does-not-work-when-one-of-the-args-has-a-space-in-it
    xvfb_args: ['-screen', '0', '1024x768x16']
  });
  xvfb.startSync();

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--kiosk', // make it full screen on load
      '--no-sandbox', '--disable-dev-shm-usage',
      '--disable-infobars' // hide the window address bars
    ],
    executablePath: process.env.CHROMIUM_PATH,
    ignoreDefaultArgs: ['--enable-automation'], // don't show the warning "Chrome is controlled by automated software"
    defaultViewport: {
      width: 1024,
      height: 768,
    }
  });

  const page = await browser.newPage();
  await page.goto(url);


  await page.waitForTimeout(2000);

  // autoplay is not reliable since browser can force disable auto-playing, I need to click on the "play" button
  // manually
  const playButton = await page.$('.play');
  await playButton?.click()


  ffmpeg.ffmpeg([], [
    '-f', 'x11grab',
    '-video_size', '1024x768',
    '-framerate', '60',
    // we have to put the `-i` after `-f`, otherwise ffmpeg will try to handle it as an invalid file,
    // and report error: ':99.0: Protocol not found, did you mean file::99.0?'
    '-i', `:${displayNumber}.0`,
    '-t', '10', // 10s
    '-pix_fmt', 'yuv420p' // just needed for QuickTime player
  ], `/output/video-${displayNumber}.mp4`, (progress: any) => {
    console.log(progress);
  }).success((json: any) => {
    console.log(json);
    xvfb.stopSync();
    browser.close();
  }).error((error: any) => {
    console.error(error)
  })

}
