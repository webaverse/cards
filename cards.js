import procgen, {types} from './procgen.js';

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const cardsSvgUrl = `${baseUrl}cards.svg`;

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

(async () => {
const qs = parseQuery(window.location.search);
const {
  t,
  w,
  name,
  description,
  image,
  minterUsername,
  minterAvatarPreview,
} = qs;
const tokenId = parseInt(t, 10);
let cardWidth = parseInt(w, 10);
if (cardWidth > 0) {
  // nothing
} else {
  cardWidth = 500;
}
const cardHeight = cardWidth / 2.5 * 3.5;

const _drawCard = async ({
  id,
  name,
  description,
  image,
  minterUsername,
  minterAvatarPreview,
  cardSvgSource,
}) => {
  const spec = procgen(id + '')[0];
  console.log('card procgen', {id, name, description});

  const svg = document.createElement('svg');
  svg.setAttribute('xmlns', "http://www.w3.org/2000/svg");
  svg.setAttribute('width', cardWidth);
  svg.setAttribute('height', cardHeight);
  svg.innerHTML = cardSvgSource;

  const container = document.getElementById('container');
  container.style.width = `${cardWidth}px`;
  container.style.height = `${cardHeight}px`;
  container.appendChild(svg);

  {
    const el = svg;

    const titleTextEl = el.querySelector('#title-text');
    titleTextEl.innerHTML = name;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const typeEl = el.querySelector('#type-' + type);
      typeEl.style.display = type === spec.stats.type ? 'block' : 'none';
    }
    [
      'hp',
      'mp',
      'attack',
      'defense',
      'speed',
      'luck',
    ].forEach(statName => {
      const statEl = el.querySelector('#' + statName);
      const texts = statEl.querySelectorAll('text');
      const textEl = texts[texts.length - 1];
      textEl.innerHTML = escape(spec.stats[statName] + '');
    });
    {
      const imageEl = el.querySelector('#Image image');
      imageEl.setAttribute('xlink:href', image);
    }
    {
      const lines = description.split('\n');
      const descriptionHeaderTextEl = el.querySelector('#description-header-text');
      descriptionHeaderTextEl.innerHTML = lines[0];
      const descriptionBodyTextEl = el.querySelector('#description-body-text');
      descriptionBodyTextEl.innerHTML = lines.slice(1).join('\n');
    }
    {
      const avatarImageEl = el.querySelector('#avatar-image image');
      avatarImageEl.setAttribute('xlink:href', minterAvatarPreview);
    }
    {
      const ilustratorTextEl = el.querySelector('#illustrator-text');
      ilustratorTextEl.innerHTML = minterUsername;
    }
    {
      const stopEls = el.querySelectorAll('#Background linearGradient > stop');
      // const c = `stop-color:${spec.art.colors[0]}`;
      stopEls[1].style.cssText = `stop-color:${spec.art.colors[0]}`;
      stopEls[3].style.cssText = `stop-color:${spec.art.colors[1]}`;
      
      const g = el.querySelector('#Background linearGradient');
      g.id = 'background-' + id;
      const p = g.nextElementSibling;
      p.style = `fill:url(#${g.id});`;
    }
  }

  (async () => {
    const outerHTML = svg.outerHTML;
    const blob = new Blob([outerHTML], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    
    /* const canvas = document.createElement('canvas');
    canvas.width = cardWidth;
    canvas.height = cardHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    const cvg = await Canvg.from(ctx, url);
    cvg.start(); */

    const image = document.createElement('img');
    image.onload = () => {
      console.log('image load', image);
    };
    image.onerror = err => {
      console.log('image error', err);
    };
    image.crossOrigin = 'Anonymous';
    image.src = url;
    document.body.appendChild(image);
  })();
  
  /* const _waitForAllCardFonts = () => Promise.all([
    'FuturaLT',
    'MS-Gothic',
    'FuturaStd-BoldOblique',
    'GillSans',
    'GillSans-CondensedBold',
    'FuturaStd-Heavy',
    'FuturaLT-CondensedLight',
    'SanvitoPro-LtCapt',
    'FuturaLT-Book',
  ].map(fontFamily => {
    return document.fonts.load(`16px "${fontFamily}"`);
  })).then(() => {});
  _waitForAllCardFonts().catch(err => {
    console.warn(err);
  }); */

  /* window.parent.postMessage({
    ok: true, 
  }, '*'); */
};
if (
  !isNaN(tokenId) &&
  typeof name === 'string' &&
  typeof description === 'string' &&
  typeof image === 'string' &&
  typeof minterUsername === 'string' &&
  typeof minterAvatarPreview === 'string'
) {
  const cardSvgSource = await (async () => {
    // console.log('base url', baseUrl);
    const res = await fetch(cardsSvgUrl);
    const cardSvgSource = await res.text();
    return cardSvgSource;
  })();
  
  _drawCard({
    id: tokenId,
    name,
    description,
    image,
    minterUsername,
    minterAvatarPreview,
    cardSvgSource,
  });
} else if (!isNaN(tokenId)) {
  const [
    cardSvgSource,
    token,
  ] = await Promise.all([
    (async () => {
      const res = await fetch(cardsSvgUrl);
      const cardSvgSource = await res.text();
      return cardSvgSource;
    })(),
    (async () => {
      const res = await fetch(`https://tokens.webaverse.com/${tokenId}`);
      const token = await res.json();
      return token;
    })(),
  ]);
  console.log('got token', token);
  const {id, name, description, image, minter: {username: minterUsername, avatarPreview: minterAvatarPreview}} = token;
  
  _drawCard({
    id,
    name,
    description,
    image,
    minterUsername,
    minterAvatarPreview,
    cardSvgSource,
  });
} else {
  console.warn('invalid qs params:', qs, [
    !isNaN(tokenId),
  ], [
    typeof id === 'string',
    typeof name === 'string',
    typeof description === 'string',
    typeof image === 'string',
    typeof minterUsername === 'string',
    typeof minterAvatarPreview === 'string',
  ]);
}

console.log('cards done render');
})();