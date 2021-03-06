/**
 * The bart-board web component module.
 *
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @version 2.0.0
 */

import './components/file-operations/index.js'
import './components/image-selector/index.js'
import './components/effect-editor/index.js'

/**
 * Define template.
 */
const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host {
      font-size: 1.2em;
      color:white;
      padding:0px;
      border:2px solid grey;
      margin:0px;
      float:left;
      border-radius: 2px;
      user-select: none;
    }
    p {
      margin: 0;
      padding: 0;
    }
  </style>
  <div id="menu-bar" class="w3-bar w3-black">
    <button id="Line" class="w3-bar-item w3-button">Line</button>
    <button id="General" class="w3-bar-item w3-button">General</button>
  </div>
  <div id="Line" class="tab-div" style="display:none">
    <image-selector></image-selector>
    <effect-editor></effect-editor>
  </div>
  <div id="General" class="tab-div" style="display:none">
    <file-operations></file-operations>
  </div>
  <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
`

/**
 * Define custom element.
 */
customElements.define('panda-gui',
  class extends HTMLElement {
    /**
     * Creates an instance of the current type.
     */
    constructor () {
      super()

      // Attach a shadow DOM tree to this element and
      // append the template to the shadow root.
      this.attachShadow({ mode: 'open' })
        .appendChild(template.content.cloneNode(true))

      // TODO: Maybee you need to define some default values here
      this._workspaceFolder = '';
      this._vscodeApi = acquireVsCodeApi()

      this._fileOperations = this.shadowRoot.querySelector('file-operations')
      this._fileOperations.SetVSCodeApiInstance(this._vscodeApi)
      this._imageSelector = this.shadowRoot.querySelector('image-selector')
      this._imageSelector.SetVSCodeApiInstance(this._vscodeApi)
      this._effectEditor = this.shadowRoot.querySelector('effect-editor')
      this._effectEditor.SetVSCodeApiInstance(this._vscodeApi)

      // Message Events
      this._menuButtons = this.shadowRoot.querySelectorAll('#menu-bar button')

      this._menuButtons.forEach(button => {
        button.addEventListener('click', (event) => this.openTab(button.textContent))
      })

      this.openTab('Line')
      
    }

    openTab(tabDivName) {
      var i
      var x = this.shadowRoot.querySelectorAll(".tab-div")
      for (i = 0; i < x.length; i++) {
        x[i].style.display = "none"
      }
      this.shadowRoot.querySelector('div' + '#' + tabDivName).style.display = "block"
      for (i = 0; i < x.length; i++) {
        this._menuButtons[i].className = this._menuButtons[i].className.replace(" w3-red", "");
      }
      this.shadowRoot.querySelector('#menu-bar button' + '#' + tabDivName).className += " w3-red";
    }

    getFileExtension(filename) {
      return filename.substring(filename.lastIndexOf('.')+1, filename.length) || filename;
    }
    
    removeFileExtension (str) {
      return str.substring(0, str.length - (this.getFileExtension(str).length + 1))
    }

    /**
     * Watches the attributes "text" and "speed" for changes on the element.
     *
     * @returns {string[]} observedAttributes array
     */
    static get observedAttributes () {
      // TODO: Add observer for text and speed.
      return []
    }

    /**
     * Called by the browser engine when an attribute changes.
     *
     * @param {string} name of the attribute.
     * @param {any} oldValue the old attribute value.
     * @param {any} newValue the new attribute value.
     */
    attributeChangedCallback (name, oldValue, newValue) {
      // TODO: Add your code for handling updates and creation of the observed attributes.
    }

    /**
     * Called after the element is inserted into the DOM.
     */
    connectedCallback () {
      // TODO: Add your eventlisteners for mousedown, mouseup here. You also need to add mouseleave to stop writing
      //       when the mouse pointer leavs the bart board. This should stop the printing.
    }

    /**
     * Called after the element has been removed from the DOM.
     */
    disconnectedCallback () {
      // TODO: Remove your eventlisterners here.
    }
  }
)
