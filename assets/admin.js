/* The admin page: keeps the list of real paintings and publishes it.
 *
 * Everything happens in the browser. Photographs are shrunk here, then written
 * to the repository through GitHub's API along with assets/gallery.js, which is
 * the list the gallery reads.
 */
(function () {
  'use strict';

  const MAX_SIDE = 1600;        // longest side of a published photograph
  const QUALITY = 0.85;
  const KEY_TOKEN = 'lapsina:token';

  const $ = function (id) { return document.getElementById(id); };
  const listEl = $('list');
  const statusEl = $('status');

  // Works already on the site, plus anything picked but not yet published.
  const works = (window.GALLERY || []).map(function (g) {
    return {
      title: g.title || '',
      year: g.year || '',
      medium: g.medium || '',
      src: g.src,
      aspect: g.aspect || [1, 1],
      framed: !!g.framed,
      data: null              // base64 of a photograph waiting to be published
    };
  });

  function say(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function slug(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  }

  function fileNameFor(work, i) {
    const base = slug(work.title) || ('painting-' + (i + 1));
    return 'assets/art/' + base + '.jpg';
  }

  // ------------------------------------------------------------ the pictures

  // Read a chosen file, shrink it, and hand back a JPEG as base64.
  function prepare(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error('could not read ' + file.name)); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error(file.name + ' is not an image the browser can open')); };
        img.onload = function () {
          const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const url = c.toDataURL('image/jpeg', QUALITY);
          resolve({ data: url.split(',')[1], preview: url, aspect: [w, h] });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(files) {
    const chosen = Array.prototype.slice.call(files).filter(function (f) { return /^image\//.test(f.type); });
    if (!chosen.length) return;
    say('Reading ' + chosen.length + ' photo' + (chosen.length > 1 ? 's' : '') + '…');
    for (let i = 0; i < chosen.length; i++) {
      try {
        const out = await prepare(chosen[i]);
        works.push({
          title: chosen[i].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          year: new Date().getFullYear(),
          medium: 'Oil on canvas',
          src: null,
          aspect: out.aspect,
          framed: true,
          data: out.data,
          preview: out.preview
        });
      } catch (err) {
        say(String(err.message || err), 'bad');
      }
    }
    render();
    say(chosen.length + ' added. Fill in the details, then publish.');
  }

  // ------------------------------------------------------------------ the list

  function render() {
    listEl.textContent = '';
    if (!works.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'No paintings yet. Add the first one below.';
      listEl.appendChild(p);
      return;
    }

    works.forEach(function (w, i) {
      const card = document.createElement('div');
      card.className = 'card';

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      const shown = w.preview || w.src;
      if (shown) thumb.style.backgroundImage = 'url("' + shown + '")';
      else thumb.textContent = 'photo missing';
      card.appendChild(thumb);

      const fields = document.createElement('div');
      fields.className = 'fields';

      fields.appendChild(field('Title', w.title, function (v) { w.title = v; }));

      const row = document.createElement('div');
      row.className = 'row';
      row.appendChild(field('Year', w.year, function (v) { w.year = v; }));
      row.appendChild(field('Medium', w.medium, function (v) { w.medium = v; }));
      fields.appendChild(row);

      const check = document.createElement('label');
      check.className = 'check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = w.framed;
      box.addEventListener('change', function () { w.framed = box.checked; });
      const label = document.createElement('span');
      label.textContent = 'The photo already includes the painting’s frame';
      check.appendChild(box);
      check.appendChild(label);
      fields.appendChild(check);

      const foot = document.createElement('div');
      foot.className = 'card-foot';

      const name = document.createElement('span');
      name.className = 'file';
      name.textContent = w.src || fileNameFor(w, i);
      foot.appendChild(name);

      if (w.data) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = 'not published yet';
        foot.appendChild(tag);
      }

      const spacer = document.createElement('span');
      spacer.className = 'spacer';
      foot.appendChild(spacer);

      foot.appendChild(button('↑', 'icon', function () { move(i, -1); }, i === 0));
      foot.appendChild(button('↓', 'icon', function () { move(i, 1); }, i === works.length - 1));
      foot.appendChild(button('Remove', 'icon danger', function () {
        works.splice(i, 1);
        render();
      }));

      fields.appendChild(foot);
      card.appendChild(fields);
      listEl.appendChild(card);
    });
  }

  function field(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'field grow';
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value == null ? '' : value;
    input.addEventListener('input', function () { onChange(input.value); });
    input.addEventListener('change', render);
    wrap.appendChild(span);
    wrap.appendChild(input);
    return wrap;
  }

  function button(text, cls, onClick, disabled) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = text;
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  }

  function move(i, by) {
    const to = i + by;
    if (to < 0 || to >= works.length) return;
    const item = works.splice(i, 1)[0];
    works.splice(to, 0, item);
    render();
  }

  // ------------------------------------------------------------- gallery.js

  function galleryFile() {
    const entries = works.map(function (w, i) {
      return {
        title: (w.title || 'Untitled').trim(),
        year: w.year === '' ? undefined : (isNaN(Number(w.year)) ? String(w.year) : Number(w.year)),
        medium: (w.medium || '').trim() || undefined,
        src: w.src || fileNameFor(w, i),
        aspect: w.aspect,
        framed: w.framed || undefined
      };
    });
    return '/* The real paintings.\n' +
      ' *\n' +
      ' * Written by the admin page at /admin.html.\n' +
      ' */\n' +
      'window.GALLERY = ' + JSON.stringify(entries, null, 2) + ';\n';
  }

  function base64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  $('download').addEventListener('click', function () {
    const blob = new Blob([galleryFile()], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gallery.js';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    say('Saved gallery.js. Put it in assets/ in the repository, along with any new photos.');
  });

  // --------------------------------------------------------------- publish

  async function gh(path, token, options) {
    const owner = $('owner').value.trim();
    const repo = $('repo').value.trim();
    const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
    const res = await fetch(url + (options ? '' : '?ref=' + encodeURIComponent($('branch').value.trim())), Object.assign({
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json'
      }
    }, options || {}));
    return res;
  }

  async function put(path, contentBase64, message, token) {
    let sha;
    const head = await gh(path, token);
    if (head.ok) sha = (await head.json()).sha;
    else if (head.status !== 404) throw new Error(path + ': GitHub said ' + head.status + '. Check the token and the repository.');

    const res = await gh(path, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: message,
        content: contentBase64,
        branch: $('branch').value.trim(),
        sha: sha
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(path + ': GitHub said ' + res.status + '. ' + body.slice(0, 200));
    }
  }

  $('publish').addEventListener('click', async function () {
    const token = $('token').value.trim();
    if (!token) { say('Paste a GitHub token first — see the note above.', 'bad'); return; }
    if (!works.length) { say('There is nothing to publish yet.', 'bad'); return; }

    const missing = works.filter(function (w) { return !w.data && !w.src; });
    if (missing.length) { say('One of the paintings has no photo.', 'bad'); return; }

    $('publish').disabled = true;
    try {
      const pending = works.filter(function (w) { return w.data; });
      for (let i = 0; i < works.length; i++) {
        const w = works[i];
        if (!w.data) continue;
        const path = fileNameFor(w, i);
        say('Uploading ' + path + '… (' + (pending.indexOf(w) + 1) + ' of ' + pending.length + ')');
        await put(path, w.data, 'Add ' + (w.title || 'a painting'), token);
        w.src = path;
        w.data = null;
      }

      say('Saving the list…');
      await put('assets/gallery.js', base64(galleryFile()), 'Update the paintings', token);

      if ($('remember').checked) {
        try { localStorage.setItem(KEY_TOKEN, token); } catch (err) { /* private mode */ }
      }
      render();
      say('Published. The website rebuilds itself in a minute or two — then reload the gallery.', 'good');
    } catch (err) {
      say(String(err.message || err), 'bad');
    } finally {
      $('publish').disabled = false;
    }
  });

  // ------------------------------------------------------------------ input

  const picker = $('picker');
  const drop = $('drop');
  picker.addEventListener('change', function () {
    addFiles(picker.files);
    picker.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (type) {
    drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    drop.addEventListener(type, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  try {
    const saved = localStorage.getItem(KEY_TOKEN);
    if (saved) { $('token').value = saved; $('remember').checked = true; }
  } catch (err) { /* private mode */ }

  render();
  window.__admin = { works: works, galleryFile: galleryFile };   // for tinkering
})();
