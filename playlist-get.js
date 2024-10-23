require("dotenv").config();
const ytpl = require("ytpl");
const ytdl = require("ytdl-core");
const ExcelJS = require("exceljs");
const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const SpotifyWebApi = require("spotify-web-api-node");
const { google } = require("googleapis");

// YouTube APIキー
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Spotify APIクライアント
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// 入力ファイルの読み込み用設定
const inputFile = "input.txt"; // 入力ファイル名。ここに各行にURLを記入する

// Excelファイルの作成
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet("YouTube Videos");
worksheet.columns = [
  { header: "Title", key: "title", width: 40 },
  { header: "URL", key: "url", width: 60 },
];

// URLの種類を判定
function identifyURLType(url) {
  if (
    url.includes("youtube.com/playlist") ||
    url.includes("youtube.com/watch") ||
    url.includes("youtu.be")
  ) {
    return "youtube";
  } else if (url.includes("spotify.com/playlist")) {
    return "spotify_playlist";
  } else if (url.includes("spotify.com/track")) {
    return "spotify_track";
  }
  return "unknown";
}

// YouTubeプレイリストの動画取得
async function extractYouTubePlaylist(playlistUrl) {
  try {
    console.log(`YouTubeのプレイリストを取得: ${playlistUrl}`);
    const playlist = await ytpl(playlistUrl, { limit: Infinity });
    return playlist.items.map((item) => ({
      title: item.title,
      url: item.shortUrl,
    }));
  } catch (error) {
    console.log(`URLのプレイリスト取得エラー: ${playlistUrl}`, error);
    return [];
  }
}

// YouTube単体動画の取得 (短縮URLや通常URLに対応)
async function extractYouTubeVideo(videoUrl) {
  try {
    console.log(`YouTubeの動画情報を取得: ${videoUrl}`);
    const info = await ytdl.getBasicInfo(videoUrl);
    return [{ title: info.videoDetails.title, url: videoUrl }];
  } catch (error) {
    console.log(`YouTube動画詳細の取得エラー: ${videoUrl}`, error);
    return [{ title: "Unknown Title (Single Video)", url: videoUrl }];
  }
}

// Spotifyの曲タイトルでYouTubeを検索
async function searchYouTubeByTitle(title) {
  const youtube = google.youtube({
    version: "v3",
    auth: YOUTUBE_API_KEY,
  });

  console.log(`YouTubeで検索: ${title}`);
  const res = await youtube.search.list({
    part: "snippet",
    q: title,
    maxResults: 1,
    type: "video",
  });

  const video = res.data.items[0];
  if (video) {
    console.log(`YouTubeで動画を検索: ${video.snippet.title}`);
    return {
      title: video.snippet.title,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    };
  } else {
    console.log(
      "Spotifyの曲タイトルからYoutubeで検索を行いましたが見つかりませんでした。"
    );
    return { title: "No match found", url: "" };
  }
}

// Spotifyプレイリストの曲情報を取得
async function extractSpotifyPlaylist(playlistUrl) {
  const playlistId = playlistUrl.split("/playlist/")[1].split("?")[0];

  try {
    console.log(`Spotifyのプレイリストを検索: ${playlistUrl}`);
    const data = await spotifyApi.getPlaylistTracks(playlistId);
    return data.body.items.map(
      (item) =>
        item.track.name +
        " " +
        item.track.artists.map((artist) => artist.name).join(", ")
    );
  } catch (error) {
    console.log(`SpotifyプレイリストのURL取得エラー: ${playlistUrl}`, error);
    return [];
  }
}

// Spotifyトラック情報を取得
async function extractSpotifyTrack(trackUrl) {
  const trackId = trackUrl.split("/track/")[1].split("?")[0];

  try {
    console.log(`Spotifyのトラック取得: ${trackUrl}`);
    const data = await spotifyApi.getTrack(trackId);
    const trackTitle = `${data.body.name} ${data.body.artists
      .map((artist) => artist.name)
      .join(", ")}`;
    console.log(`Spotifyトラック検索: ${trackTitle}`);
    return [trackTitle];
  } catch (error) {
    console.log(`Spotifyトラック取得エラー: ${trackUrl}`, error);
    return [];
  }
}

// メイン処理
async function processURLs() {
  // Spotify APIにアクセスするためのトークンを取得
  await spotifyApi
    .clientCredentialsGrant()
    .then((data) => {
      spotifyApi.setAccessToken(data.body["access_token"]);
    })
    .catch((err) => {
      console.log("Spotify API認証エラー", err);
    });

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let count = 0;

  for await (const line of rl) {
    const url = line.trim();
    const urlType = identifyURLType(url);
    count++;
    console.log(`Processing URL ${count}: ${url}`);

    if (urlType === "youtube") {
      let videos = [];
      if (url.includes("playlist")) {
        videos = await extractYouTubePlaylist(url);
      } else {
        videos = await extractYouTubeVideo(url);
      }

      videos.forEach((video) => {
        worksheet.addRow({ title: video.title, url: video.url });
      });
    } else if (urlType === "spotify_playlist") {
      console.log(`Spotifyプレイリスト: ${url}`);
      const trackTitles = await extractSpotifyPlaylist(url);

      for (const trackTitle of trackTitles) {
        const video = await searchYouTubeByTitle(trackTitle);
        worksheet.addRow({ title: video.title, url: video.url });
      }
    } else if (urlType === "spotify_track") {
      console.log(`Spotifyのトラック: ${url}`);
      const trackTitles = await extractSpotifyTrack(url);

      for (const trackTitle of trackTitles) {
        const video = await searchYouTubeByTitle(trackTitle);
        worksheet.addRow({ title: video.title, url: video.url });
      }
    } else {
      console.log(`不明またはサポートされていないURL: ${url}`);
    }
  }

  // Excelファイルの保存
  await workbook.xlsx.writeFile("YouTube_Videos.xlsx");
  console.log(
    "YouTubeの動画情報がYouTube_Videos.xlsxにエクスポートされました。"
  );
}

// プログラム実行
processURLs().catch((err) => console.log("Error: ", err));
