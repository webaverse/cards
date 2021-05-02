import procgen, {types} from './procgen.js';

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
  id,
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

  const svg = document.createElement('svg');
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

if (!isNaN(tokenId)) {
  const [
    cardSvgSource,
    token,
  ] = await Promise.all([
    (async () => {
      const res = await fetch('/cards.svg');
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
} else if (
  typeof id === 'string' &&
  typeof name === 'string' &&
  typeof description === 'string' &&
  typeof image === 'string' &&
  typeof minterUsername === 'string' &&
  typeof minterAvatarPreview === 'string'
) {
  const cardSvgSource = await (async () => {
    const res = await fetch('/cards.svg');
    const cardSvgSource = await res.text();
    return cardSvgSource;
  })();
  
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
    isNaN(tokenId),
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