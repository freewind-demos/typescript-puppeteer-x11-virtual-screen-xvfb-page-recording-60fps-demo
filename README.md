TypeScript Puppeteer X11 Virtual Screen Xvfb Page Recording 60fps Demo
===========================

如果使用puppeteer-screen-recorder来对页面变化录屏，由于它基于node puppeteer API的`Page.screencastFrame`事件，
但是这个事件在当页面中有视频或动画的时候，每秒只会发送5到20帧，不可能达到60fps这样的流畅效果：
https://github.com/prasanaworld/puppeteer-screen-recorder/issues/6#issuecomment-842558748

它们在等chromium来提供一个新的更高效的流协议，但是目前还没有进展：https://bugs.chromium.org/p/chromium/issues/detail?id=781117

有一种虚拟显示器录屏方案：
1. 使用Xvfb创建一个虚拟显示器
2. 用puppeteer在该虚拟显示器中打开chromium，使用headful模式
3. 打开目标页面（如一个60fps的视频）
4. 在上面进行操作
5. 同时使用一个子进程对该虚拟显示器进行录屏，可以达到流畅的录制效果

注意：
1. 本项目使用了基于ubuntu的docker，而不是`node:16.0.0-alpine`，因为后者缺少了一些必要的库或者服务
2. 在代码中使用了对Xvfb以及ffmpeg进行包装的npm库，它们都比较粗糙，不太好用，传参数那块容易出问题，踩了很多坑

```
npm install
npm run demo
```

运行成功后，将在`output`目录下生成一个`video.mp4`视频文件。


