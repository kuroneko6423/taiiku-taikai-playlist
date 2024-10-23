const audioPlayer = document.getElementById("audio-player");
const mp3ListElement = document.getElementById("mp3-list");
let mp3Files = [];
let currentTrack = 0;

// MP3ファイルリストを取得して表示
fetch("/api/mp3files")
  .then((response) => response.json())
  .then((data) => {
    mp3Files = data;
    displayMp3List(mp3Files);
    if (mp3Files.length > 0) {
      playTrack(currentTrack);
    }
  })
  .catch((error) => console.error("Error fetching MP3 files:", error));

// MP3ファイルリストを表示する関数
function displayMp3List(files) {
  files.forEach((file, index) => {
    const li = document.createElement("li");
    li.textContent = file;
    li.addEventListener("click", () => playTrack(index));
    mp3ListElement.appendChild(li);
  });
}

// MP3を再生する関数
function playTrack(index) {
  currentTrack = index;
  audioPlayer.src = `/mp3/${mp3Files[index]}`;
  audioPlayer.play();
}

// 再生終了時に次のトラックを自動的に再生
audioPlayer.addEventListener("ended", () => {
  currentTrack = (currentTrack + 1) % mp3Files.length;
//  currentTrack = (currentTrack + randam) % mp3File.length; // 次のトラック、リストの最後に到達したら最初に戻る
  playTrack(currentTrack);
});
