const DB_NAME = 'QQMusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveAudioToDB(fileObj) {
  try {
    const db = await openDB();
    const response = await fetch(fileObj.blobUrl);
    const arrayBuffer = await response.arrayBuffer();
    const record = {
      id: fileObj.id,
      title: fileObj.title,
      artist: fileObj.artist,
      lyrics: fileObj.lyrics || '',
      type: fileObj.type,
      data: arrayBuffer,
      mimeType: fileObj.mimeType || 'audio/mpeg',
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => { db.close(); reject(e.target.error); };
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

export async function loadAllAudioFromDB(metadataList) {
  try {
    const db = await openDB();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
    db.close();

    const recordMap = new Map(records.map(r => [r.id, r]));
    return metadataList.map(meta => {
      const record = recordMap.get(meta.id);
      if (record && record.data) {
        const blob = new Blob([record.data], { type: record.mimeType || 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        return {
          ...meta,
          blobUrl,
          lyrics: record.lyrics || meta.lyrics || '',
        };
      }
      return meta;
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return metadataList;
  }
}

export async function deleteAudioFromDB(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => { db.close(); reject(e.target.error); };
    });
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}
