/**
 * The bart-board web component module.
 *
 * @author Johan Leitet <johan.leitet@lnu.se>
 * @author Mats Loock <mats.loock@lnu.se>
 * @author Erik Lindholm <elimk06@student.lnu.se>
 * @version 2.0.0
 */

/**
 * Define template.
 */
const template = document.createElement('template')
template.innerHTML = `
  <style>
    :host {
      font-size: 1.2em;
      color:white;
      padding:10px;
      border:2px solid grey;
      margin:10px;
      float:left;
      border-radius: 2px;
      user-select: none;
    }
    #file-operations-container {
      display: block;
      border: 2px solid grey;
      margin-bottom: 4px;
    }
  </style>
  <div id="file-operations-container">
    <input id="file-input" type="file" webkitdirectory directory multiple>
    <button id="rename-to-3-digits-button">Rename to 3 Digits</button>
  </div>
`

/**
* Define custom element.
*/
customElements.define('file-operations',
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

      // File renaming field
      this._selectFileInput = this.shadowRoot.querySelector('#file-input')
      this._lastSelectedFiles = null
      this._renameTo3DigitsButton = this.shadowRoot.querySelector('#rename-to-3-digits-button')

      // Message Events
      window.addEventListener('message', event => {

        if (event.data.command == 'set-state') {

        }

        if (event.data.command == 'set-workspace-folder') {
          this._workspaceFolder = event.data.workspaceFolder
        }
      })

      this._selectFileInput.onchange = () => {
        let files = this._selectFileInput.files
        for(let i = 0; i < files.length; i++) {
          console.log(files[i]);
        }
        this._lastSelectedFiles = files
      }

      this._renameTo3DigitsButton.addEventListener("click", () => {
        if (this._selectFileInput.files.length > 0) {
          let files = []
          for(let i = 0; i < this._selectFileInput.files.length; i++) {
            files.push(this._selectFileInput.files[i].path)
          }
          this._vscodeApi.postMessage({
            command: 'rename-to-3-digits',
            files: files
          })
          this._selectFileInput.files = null
        }
      })
    }

    SetVSCodeApiInstance (vscodeApiInstance) {
      this._vscodeApi = vscodeApiInstance
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
