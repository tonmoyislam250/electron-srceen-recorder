const { writeFile } = require('fs');
// const ffmpegstatic = require('ffmpeg-static')
// const fluent = require('fluent-ffmpeg')
const stream = require('stream')
const electronRemote = process.type === 'browser' ? electron : require('@electron/remote');
const { desktopCapturer, ipcMain, Menu, dialog } = electronRemote;
const { ipcRenderer } = require('electron')
const videoSelectBtn = document.getElementById('videoSelectBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoElement = document.getElementById('video');
const sourceNotSelectedText = document.getElementById("sourceNotSelectedText");
const closeVideoShareBtn = document.getElementById("closeVideoShareBtn");


invokeContextMenu = (data, type) => {
    ipcRenderer.invoke('context-menu', JSON.stringify({ data, type }))
}

ipcMain.handle('context-menu', async (event, sources) => {
    const source = JSON.parse(sources)

    const contextMenu =
        Menu.buildFromTemplate(
            source.data.map(item => ({
                label: item.name,
                click: source.type === 'input'
                    ? () => {
                        selectSource(item);
                    } : () => {

                    }
            }))
        )
    contextMenu.popup()
})


// async function selectOutputFormat() {
//     invokeContextMenu([
//         { id: 'mp4', name: 'mp4' },
//         { id: 'webm', name: 'webm' },
//         { id: 'gif', name: 'gif' },
//         { id: 'webp', name: 'webp' },
//         { id: 'apng', name: 'apng' },
//     ], 'output')
// }


// async function createReadableVideoBuffer() {
//     const readableVideoBuffer = new stream.PassThrough()
//     readableVideoBuffer.write(buffer)
//     readableVideoBuffer.end()
//     readableVideoBuffer.destroy()
//     return readableVideoBuffer
// }
// createVideoFile = async function (filePath) {
//     fluent.setFfmpegPath(ffmpegstatic);
//     const readableVideoBuffer = createReadableVideoBuffer()

//     fluent()
//         .input(readableVideoBuffer)
//         .output(filePath)
//         .withNoAudio()
//         .on('start', () => { console.log("Hello hI"); })
//         .on('end', () => { console.log("Hello Bye"); })
//         .run()
// }

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });
    invokeContextMenu(inputSources, 'input')
}


videoSelectBtn.onclick = getVideoSources;
let mediaRecorder;
const recordedChunks = [];


async function selectSource(source) {
    videoElementToggle(true);
    startRecordingBtnToggle(true);
    closeVideoShareBtnToggle(true);

    sourceNotSelectedText.style.display = "none";

    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };


    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();


    const options = { mimeType: 'video/webm; codecs=H264' };
    mediaRecorder = new MediaRecorder(stream, options);


    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

startBtn.onclick = () => {
    mediaRecorder.start();
    startBtn.className = "btn btn-danger";
    startBtn.innerText = "Recording";
    startBtn.setAttribute("disabled", "");
    videoSelectBtn.setAttribute("disabled", "");
    closeVideoShareBtn.setAttribute("disabled", "");

    stopRecordingBtnToggle();
};

stopBtn.onclick = () => {
    mediaRecorder.stop();
    startBtn.className = "btn btn-success";
    startBtn.innerHTML = "<i class=\"fa-solid fa-play\"></i> Start recording";
    startBtn.removeAttribute("disabled");
    videoSelectBtn.removeAttribute("disabled");
    closeVideoShareBtn.removeAttribute("disabled");

    stopRecordingBtnToggle();
};

closeVideoShareBtn.onclick = () => {
    videoElement.removeAttribute('src');
    videoElement.load();

    startRecordingBtnToggle();
    closeVideoShareBtnToggle();
    sourceSelectedToggle();
    videoElementToggle();
    videoSelectBtn.innerHTML = "<i class=\"fa-solid fa-desktop\"></i> Share screen";
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}


// async function exportvid() {
// }


async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=H264'
    });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    // if (filePath)
    //     await createVideoFile(filePath)
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
}

function elementToggle(element, display = null) {
    if (display === true || element.style.display == "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

function sourceSelectedToggle(display = null) {
    elementToggle(sourceNotSelectedText, display);
}

function closeVideoShareBtnToggle(display = null) {
    elementToggle(closeVideoShareBtn, display);
}

function videoElementToggle(display = null) {
    elementToggle(videoElement, display);
}

function startRecordingBtnToggle(display = null) {
    elementToggle(startBtn, display);
}

function stopRecordingBtnToggle(display = null) {
    elementToggle(stopBtn, display);
}


