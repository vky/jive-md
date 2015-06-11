// ==UserScript==
// @name        Jive Markdown
// @namespace   maltera.com
// @description Provide a Markdown editor in Jive.
// @version     0.1
// @downloadURL https://raw.githubusercontent.com/Elemecca/jive-md/master/jive-md.user.js
// @updateURL   https://raw.githubusercontent.com/Elemecca/jive-md/master/jive-md.user.js
//
// @include     /^https://[^.]+\.jiveon\.com/[^?#]+/edit([?#].*)?$/
// @include     /^https://[^.]+\.jiveon\.com/[^?#]+/create([?#].*)?$/
//
// @resource    md-html  https://raw.githubusercontent.com/neocotic/html.md/3.0.2/dist/md.min.js
// @resource    md-conv  https://raw.githubusercontent.com/ujifgc/pagedown/f1ae0f5626/Markdown.Converter.js
// @resource    md-edit  https://raw.githubusercontent.com/ujifgc/pagedown/f1ae0f5626/Markdown.Editor.js
// @resource    md-sani  https://raw.githubusercontent.com/ujifgc/pagedown/f1ae0f5626/Markdown.Sanitizer.js
// @grant       GM_getResourceURL
// @grant       unsafeWindow
// @noframes
// ==/UserScript==

var Markdown;

function loadScripts (callback) {
  let scripts = [
    GM_getResourceURL( 'md-conv' ),
    GM_getResourceURL( 'md-edit' ),
    GM_getResourceURL( 'md-sani' ),
    GM_getResourceURL( 'md-html' ),
  ];

  for (let url of scripts) {
    let script = document.createElement( 'script' );
    script.setAttribute( 'type', 'text/javascript' );
    script.setAttribute( 'src', url );

    script.addEventListener( 'load', function (event) {
      scripts.splice( scripts.indexOf( event.target.url ), 1 );

      if (0 === scripts.length) {
        Markdown = unsafeWindow.Markdown;
        Markdown.fromHTML = unsafeWindow.md.noConflict();
        window.setTimeout( callback, 0 );
      }
    });

    document.head.appendChild( script );
  }
}


loadScripts( function() {
  // scroll so the editor is reasonably positioned
  // Jive's enormous header is really annoying
  document.querySelector( '#jive-body header' ).scrollIntoView();
    
  let mce = unsafeWindow.tinymce.EditorManager.get( 'wysiwygtext' );
  mce.save();
  mce.hide();
  
  let output = document.getElementById( 'wysiwygtext' );
  output.style.display = 'none';
  
  let wrapper = document.createElement( 'div' );
  wrapper.style.overflow = 'hidden';
  
  let buttons = document.createElement( 'div' );
  buttons.id = 'wmd-button-bar';
  buttons.style.display = 'none';
  wrapper.appendChild( buttons );
    
  let input = document.createElement( 'textarea' );
  input.id = 'wmd-input';
  input.style.float = 'left';
  input.style.width = '50%';
  input.style.height = '80vw';
  input.style.marginRight = '1em';
  wrapper.appendChild( input );
  
  let preview = document.createElement( 'div' );
  preview.id = 'wmd-preview';
  preview.style.overflow = 'auto';
  wrapper.appendChild( preview );
    
  let panel = document.querySelector( '#edit-document .jive-editor-panel' );
  if (! panel) {
      panel = document.querySelector( '#create-document .jive-editor-panel' );
  }
  panel.appendChild( wrapper );
    
  try {
    input.value = Markdown.fromHTML( output.value );
  } catch (caught) {
    console.error( "error converting HTML", caught );
  }
    
  let converter = Markdown.getSanitizingConverter();
  let editor = new Markdown.Editor( converter );

  let mceOpt = createObjectIn( unsafeWindow );
  mceOpt.format = 'raw';
    
  converter.hooks.chain( 'postConversion', exportFunction( function (html) {
    mce.setContent( html, mceOpt );
    return html;
  }, unsafeWindow ) );
  
  try {
    editor.run();
  } catch (caught) {
    console.error( "error starting PageDown", caught );
  }
    
  input.focus();
});
