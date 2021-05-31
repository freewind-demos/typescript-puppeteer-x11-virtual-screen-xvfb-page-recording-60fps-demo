import {runCommandAsync} from './runCommand';

import puppeteer from 'puppeteer';
import {wait} from './wait';

const process = require('process');

const DISPLAY_NUMBER = 99;
const SCREEN = 0;
const WIDTH = 1024;
const HEIGHT = 768;

process.env.DISPLAY = `:${DISPLAY_NUMBER}`;

export async function openPageAndRecording(url: string): Promise<void> {
  const asyncXvfb = runCommandAsync('Xvfb', [`:${DISPLAY_NUMBER}`, '-screen', SCREEN.toString(), `${WIDTH}x${HEIGHT}x16`], {
    onData: console.log,
    onError: console.log,
    onComplete: console.log
  })

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--kiosk', // make it full screen on load
      '--no-sandbox', '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-infobars' // hide the window address bars
    ],
    executablePath: process.env.CHROMIUM_PATH,
    ignoreDefaultArgs: ['--enable-automation'], // don't show the warning "Chrome is controlled by automated software"
    defaultViewport: {
      width: WIDTH,
      height: HEIGHT,
    }
  });

  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForTimeout(2000);

  // autoplay is not reliable since browser can force disable auto-playing, I need to click on the "play" button
  // manually
  const playButton = await page.$('.play');
  await playButton?.click()


  const asyncFfmpeg = runCommandAsync('ffmpeg', [
    '-f', 'x11grab',
    '-video_size', `${WIDTH}x${HEIGHT}`,
    '-framerate', '60',
    // we have to put the `-i` after `-f`, otherwise ffmpeg will try to handle it as an invalid file,
    // and report error: ':99.0: Protocol not found, did you mean file::99.0?'
    '-i', `:${DISPLAY_NUMBER}.${SCREEN}`,
    '-t', '10', // 10s
    '-pix_fmt', 'yuv420p', // just needed for QuickTime player
    '-y', // overwrite existing file
    `/output/video.mp4`
  ], {
    onData: (data) => {
      console.log(data)
    },
    onError: (error) => {
      // FIXME ffmpeg will output progress information to stderr instead of stdout, not sure how to fix it
      console.log('Error: ', error)
    },
    onComplete: () => {
      asyncFfmpeg.kill();
      browser.close();
      asyncXvfb.kill();
    }
  })

}
