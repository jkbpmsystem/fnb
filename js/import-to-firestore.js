/*
  Browser import helper.
  Usage:
  1. Open your app after Firebase config is set.
  2. In browser console paste/load this file.
  3. Run importAssetsToFirestore({ module: 'FEMS', assets: [...] })
*/

async function importAssetsToFirestore({ module = 'FEMS', assets = [] } = {}) {
  const { db, fsMod } = await window.firebaseReady;
  const moduleKey = String(module).toLowerCase();

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error('assets array is empty');
  }

  const chunkSize = 200;
  let imported = 0;

  for (let i = 0; i < assets.length; i += chunkSize) {
    const chunk = assets.slice(i, i + chunkSize);
    const batch = fsMod.writeBatch(db);

    chunk.forEach((asset, index) => {
      const assetId = String(asset.id || `${module.toUpperCase()}-IMPORT-${i + index + 1}`);
      const ref = fsMod.doc(db, 'modules', moduleKey, 'assets', assetId);
      batch.set(ref, {
        ...asset,
        module: String(module).toUpperCase(),
        importedAt: fsMod.serverTimestamp(),
        updatedAt: fsMod.serverTimestamp()
      }, { merge: true });
    });

    await batch.commit();
    imported += chunk.length;
    console.log(`Imported ${imported}/${assets.length}`);
  }

  return { status: 'success', imported };
}

window.importAssetsToFirestore = importAssetsToFirestore;
