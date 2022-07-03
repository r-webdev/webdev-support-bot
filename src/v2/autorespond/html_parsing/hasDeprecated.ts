import { parse } from 'node-html-parser';

import { mapʹ } from '../../utils/map.js';

const deprecatedElementsMap = new Map([
  [
    'acronym',
    'The <acronym> HTML element allows authors to clearly indicate a sequence of characters that compose an acronym or abbreviation for a word.',
  ],
  [
    'applet',
    'The obsolete HTML Applet Element (<applet>) embeds a Java applet into the document; this element has been deprecated in favor of object.',
  ],
  [
    'basefont',
    "The <basefont> HTML element is deprecated. It sets a default font face, size, and color for the other elements which are descended from its parent element. With this set, the font's size can then be varied relative to the base size using the font element.",
  ],
  [
    'bgsound',
    'The <bgsound> HTML element is deprecated. It sets up a sound file to play in the background while the page is used; use audio instead.',
  ],
  [
    'big',
    "The <big> HTML deprecated element renders the enclosed text at a font size one level larger than the surrounding text (medium becomes large, for example). The size is capped at the browser's maximum permitted font size.",
  ],
  [
    'blink',
    'The <blink> HTML element is a non-standard element which causes the enclosed text to flash slowly.',
  ],
  [
    'center',
    "The <center> HTML element is a block-level element that displays its block-level or inline contents centered horizontally within its containing element. The container is usually, but isn't required to be, body.",
  ],
  [
    'content',
    "The <content> HTML element—an obsolete part of the Web Components suite of technologies—was used inside of Shadow DOM as an insertion point, and wasn't meant to be used in ordinary HTML. It has now been replaced by the slot element, which creates a point in the DOM at which a shadow DOM can be inserted.",
  ],
  [
    'dir',
    'The <dir> HTML element is used as a container for a directory of files and/or folders, potentially with styles and icons applied by the user agent. Do not use this obsolete element; instead, you should use the ul element for lists, including lists of files.',
  ],
  [
    'font',
    'The <font> HTML element defines the font size, color and face for its content.',
  ],
  [
    'frame',
    'The <frame> HTML element defines a particular area in which another HTML document can be displayed. A frame should be used within a frameset.',
  ],
  [
    'frameset',
    'The <frameset> HTML element is used to contain frame elements.',
  ],
  [
    'hgroup',
    'The <hgroup> HTML element represents a multi-level heading for a section of a document. It groups a set of <h1>–<h6> elements.',
  ],
  [
    'image',
    'The <image> HTML element is an obsolete remnant of an ancient version of HTML lost in the mists of time; use the standard img element instead. Seriously, the specification even literally uses the words "Don\'t ask" when describing this element.',
  ],
  [
    'keygen',
    'The <keygen> HTML element exists to facilitate generation of key material, and submission of the public key as part of an HTML form. This mechanism is designed for use with Web-based certificate management systems. It is expected that the <keygen> element will be used in an HTML form along with other information needed to construct a certificate request, and that the result of the process will be a signed certificate.',
  ],
  [
    'marquee',
    'The <marquee> HTML element is used to insert a scrolling area of text. You can control what happens when the text reaches the edges of its content area using its attributes.',
  ],
  [
    'menuitem',
    'The <menuitem> HTML element represents a command that a user is able to invoke through a popup menu. This includes context menus, as well as menus that might be attached to a menu button.',
  ],
  [
    'nobr',
    'The <nobr> HTML element prevents the text it contains from automatically wrapping across multiple lines, potentially resulting in the user having to scroll horizontally to see the entire width of the text.',
  ],
  [
    'noembed',
    'The <noembed> HTML element is an obsolete, non-standard way to provide alternative, or "fallback", content for browsers that do not support the embed element or do not support the type of embedded content an author wishes to use. This element was deprecated in HTML 4.01 and above in favor of placing fallback content between the opening and closing tags of an object element.',
  ],
  [
    'noframes',
    "The <noframes> HTML element provides content to be presented in browsers that don't support (or have disabled support for) the frame element. Although most commonly-used browsers support frames, there are exceptions, including certain special-use browsers including some mobile browsers, as well as text-mode browsers.",
  ],
  [
    'plaintext',
    'The <plaintext> HTML element renders everything following the start tag as raw text, ignoring any following HTML. There is no closing tag, since everything after it is considered raw text.',
  ],
  [
    'rb',
    'The <rb> HTML element is used to delimit the base text component of a  ruby annotation, i.e. the text that is being annotated. One <rb> element should wrap each separate atomic segment of the base text.',
  ],
  [
    'rtc',
    'The <rtc> HTML element embraces semantic annotations of characters presented in a ruby of rb elements used inside of ruby element. rb elements can have both pronunciation (rt) and semantic (rtc) annotations.',
  ],
  [
    'shadow',
    'The <shadow> HTML element—an obsolete part of the Web Components technology suite—was intended to be used as a shadow DOM insertion point. You might have used it if you have created multiple shadow roots under a shadow host. It is not useful in ordinary HTML.',
  ],
  [
    'spacer',
    'The <spacer> HTML element is an obsolete HTML element which allowed insertion of empty spaces on pages. It was devised by Netscape to accomplish the same effect as a single-pixel layout image, which was something web designers used to use to add white spaces to web pages without actually using an image. However, <spacer> no longer supported by any major browser and the same effects can now be achieved using simple CSS.',
  ],
  [
    'strike',
    'The <strike> HTML element places a strikethrough (horizontal line) over text.',
  ],
  [
    'tt',
    'The <tt> HTML element creates inline text which is presented using the user agent default monospace font face. This element was created for the purpose of rendering text as it would be displayed on a fixed-width display such as a teletype, text-only screen, or line printer.',
  ],
  [
    'xmp',
    'The <xmp> HTML element renders text between the start and end tags without interpreting the HTML in between and using a monospaced font. The HTML2 specification recommended that it should be rendered wide enough to allow 80 characters per line.',
  ],
]);

const deprecatedElSelector = [...deprecatedElementsMap.keys()].join(',');

export function hasDeprecatedHTMLElementInSource(
  str: string
): string[][] | false {
  const root = parse(str);

  const deprecatedElements = root.querySelectorAll(deprecatedElSelector);

  const uniqueElements = new Set(
    deprecatedElements.map(item => item.rawTagName.toLowerCase())
  );
  if (uniqueElements.size > 0) {
    return [
      ...mapʹ(item => [item, deprecatedElementsMap.get(item)], uniqueElements),
    ];
  }
  return false;
}
