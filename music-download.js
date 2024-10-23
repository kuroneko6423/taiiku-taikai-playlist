const ExcelJS = require('exceljs');
const { exec } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

// Excelファイル名
const inputFile = 'YouTube_Videos.xlsx'; // ダウンロードしたExcelファイルの名前

// 出力ディレクトリの作成
const outputDir = './downloads';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// MP3をダウンロードする関数 (yt-dlpを使用)
async function downloadMP3(url, outputPath) {
  return new Promise((resolve, reject) => {
    // yt-dlpコマンドの変更: 音声のみをMP3形式で最高音質でダウンロード
    const command = `yt-dlp.exe -f bestaudio --audio-format mp3 --audio-quality 0 -o "${outputPath}.mp3" "${url}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error downloading ${url}: ${stderr}`);
      } else {
        console.log(`Downloaded: ${outputPath}.mp3`);
        resolve(`${outputPath}.mp3`);
      }
    });
  });
}

// MP3ファイルの長さを計測する関数
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(`ファイル読み込みエラー: ${filePath}: ${err.message}`);
      } else {
        const duration = metadata.format.duration;
        resolve(duration); // 秒単位の長さ
      }
    });
  });
}

// メイン処理
async function processExcelFile() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputFile);
  const worksheet = workbook.getWorksheet(1); // シート1を指定

  for (let i = 2; i <= worksheet.rowCount; i++) { // 2行目から処理
    const row = worksheet.getRow(i);
    const title = row.getCell(1).value; // タイトル
    const url = row.getCell(2).value; // URL
    if (!url) continue; // URLがない場合はスキップ

    const outputFileName = path.join(outputDir, `${title.replace(/[\/\\?%*:|"<>]/g, '')}.mp3`); // 不正なファイル名文字を除去

    // ファイルが既に存在する場合はスキップし、長さを計測
    if (fs.existsSync(outputFileName)) {
      console.log(`ファイルは既に存在します: ${outputFileName} のダウンロードをスキップしました。`);
      try {
        // ファイルの長さを計測
        const duration = await getAudioDuration(outputFileName);
        const durationInMinutes = (duration / 60).toFixed(2);

        // 曲の長さをExcelに記録
        row.getCell(3).value = `${durationInMinutes} min`;
        row.commit(); // 行をコミット
        console.log(`処理完了: ${title}, 時間: ${durationInMinutes} 分`);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        // MP3をダウンロード
        const downloadedFilePath = await downloadMP3(url, outputFileName);

        // 曲の長さを計測
        const duration = await getAudioDuration(downloadedFilePath);
        const durationInMinutes = (duration / 60).toFixed(2);

        // 曲の長さをExcelに記録
        row.getCell(3).value = `${durationInMinutes} min`;
        row.commit(); // 行をコミット
        console.log(`処理完了: ${title}, 時間: ${durationInMinutes} 分`);
      } catch (error) {
        console.log(error);
      }
    }
  }

  // 更新されたExcelファイルを保存
  await workbook.xlsx.writeFile('YouTube_Videos_Processed.xlsx');
  console.log('ダウンロード処理が完了し、YouTube_Videos_Processed.xlsxに曲データを保存しました。');
}

// プログラム実行
processExcelFile().catch(err => console.log('Error:', err));
