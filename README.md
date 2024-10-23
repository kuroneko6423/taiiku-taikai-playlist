# プログラムの動作要件
- Nodejs (https://nodejs.org/en/)
- FFmpeg (https://www.ffmpeg.org/)
- yt-dlp (https://github.com/yt-dlp/yt-dlp)


## 各プログラム概要
- playlist-get.js
> input.txtから入力したURLを取得<br>
> YouTubeの動画/プレイリストから動画の情報取得<br>
> Spotifyの音楽/プレイリストをAPIからタイトルを取得し、YouTube APIからタイトルをもとにYouTubeにて検索を行い一致するものを動画情報として取得<br>
> 以上で取得した情報をExcelデータにてYouTubeのタイトルとURLを保存する。<br>
> Excelデータ保存名: YouTube_Videos.xlsx


- music-download.js
> playlist-get.jsにて処理を行ったExcelデータを元にyt-dlpで曲をダウンロード<br>
> ffmpegにて曲の時間を取得<br>
> 以上で取得した情報をExcelデータにてタイトル、URL、時間を保存する。<br>
> Excelデータ保存名: YouTube_Videos_Processed.xlsx


- server.js
> 音楽の量が多くてプレイヤーで再生できなかったりした場合に使ってください。<br>
> 正直[VLC](https://www.videolan.org/vlc/index.ja.html)や[AIMP](https://www.aimp.ru/?do=download)で再生できると思うので本プログラムはそこまで使わないと思います。<br>
> 本プログラムexpressパッケージを使用してWebサーバーを起動し、Webにて音楽の再生を管理します。<br>
> Webで曲を選択したら再生され、再生が終わったら自動的に次の曲が再生されます。<br>
> ※本プログラムの動作は保証しません。


## 動作説明

1. [Node.js](https://nodejs.org/en/) をダウンロード/インストール
2. [FFmpeg](https://www.ffmpeg.org/) をダウンロード/解凍する
3. FFmpegを[この記事](https://taziku.co.jp/blog/windows-ffmpeg)を元に設定する。
4. input.txtに生徒からGoogle Form等で募集したYouTube、SpotifyのURLを入れる。
5. .envにYouTubeのAPIKeyとSpotifyのAPIKeyを設定する。(本API KeyはYouTube/Spotifyのアカウントが必要です。)
6. 全てが設定し終わったら、最初に`install.bat`を実行
7. `get-playlist.bat`を実行
8. 生成された`YouTube_Videos.xlsx`をもとにjasracやnextoneで著作権で`放送`の部分が許可されているか確認。されていなければURLを削除。
8. `music-download.js`を実行
9. downloadsフォルダにmp3ファイルが存在していれば成功です。
> もしも正常に動作しなかった場合やダウンロードされていなければyt-dlpの最新バージョンにyt-dlp.exeを置き換えてください。


以上です。<br>
何かあれば以下のSNS/メールまで連絡をお願いします。


Twitter: https://x.com/kuroneko6423<br>
Mail: kuroneko「@」kuroneko6423.com

Copyright © 2024 黒猫ちゃん All Rights Reserved.