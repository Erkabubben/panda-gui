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
    p {
      margin: 0;
      padding: 0;
    }
    #selectable-images-container {
      display: flex;
      flex-wrap: wrap;
    }
    .cinematic-img-container img {
      width: 64px;
      padding: 1px;
    }
    .portrait-img-container img {
      width: 96px;
      padding: 1px;
    }
    #selectable-images-container img:hover {
      outline: 4px solid red;
      outline-offset: -4px;
    }
    #selectable-images-container img.selected {
      outline: 4px solid yellow;
      outline-offset: -4px;
    }
    #selectable-images-container img.selected:hover {
      outline: 4px solid orange;
      outline-offset: -4px;
    }
    #top-container {
      display: inline-block;
      border: 2px solid grey;
      height: 200px;
      overflow: hidden;
      white-space: nowrap;
    }
    #top-container div {
      position: relative;
      height: 200px;
    }
    #top-container div#top-left-container {
      float:left;
    }
    #top-container div#top-right-container {
      float:left;
    }
    #top-container div img {
      height: 100%;
    }
    p.bottom-right-text {
      position: absolute;
      bottom: 2px;
      right: 2px;
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
  <div id="top-container">
    <div id="top-left-container">
      <img id="current-image"></img>
      <p id="current-image-text" class="bottom-right-text">image-0</p>
    </div>
    <div id="top-right-container">
      <img id="hovered-image"></img>
      <p id="hovered-image-text" class="bottom-right-text">image-1</p>
    </div>
  </div>
  <div id="selectable-images-container"></div>
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
      this._currentImage = this.shadowRoot.querySelector('img#current-image')
      this._currentImageText = this.shadowRoot.querySelector('#current-image-text')
      this._hoveredImage = this.shadowRoot.querySelector('img#hovered-image')
      this._hoveredImageText = this.shadowRoot.querySelector('#hovered-image-text')
      this._selectableImagesContainer = this.shadowRoot.querySelector('#selectable-images-container')
      this._workspaceFolder = '';
      this._vscodeApi = acquireVsCodeApi();
      this._selectFileInput = this.shadowRoot.querySelector('#file-input')
      this._lastSelectedFiles = null
      this._renameTo3DigitsButton = this.shadowRoot.querySelector('#rename-to-3-digits-button')
      //this.shadowRoot.querySelector('#file-operations-container').style.display = 'none'

      window.addEventListener('message', event => {
        if (event.data.command == 'changed-selection') {
          this.onSelectionChange(event)
        } else if (event.data.command == 'set-workspace-folder') {
          this._workspaceFolder = event.data.workspaceFolder
        } else if (event.data.command == 'no-selection') {
          this._currentImage.removeAttribute('src')
        } else if (event.data.command == 'update-selectable-images')
          this.updateSelectableImages(event)
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

    onSelectionChange (event) {
      this._currentImage.setAttribute('src', event.data.image.Uri)
      this._currentImage.setAttribute('file', event.data.image.fileName)
      this._currentImageText.textContent = this.removeFileExtension(event.data.image.fileName)
      this._hoveredImageText.textContent = ''
    }

    updateSelectableImages(event) {
      while (this._selectableImagesContainer.firstChild) {
        this._selectableImagesContainer.removeChild(this._selectableImagesContainer.lastChild);
      }
      this._selectableImagesContainer.classList.remove('cinematic-img-container')
      this._selectableImagesContainer.classList.remove('portrait-img-container')
      this._selectableImagesContainer.classList.add(event.data.imageType + '-img-container')
      event.data.selectableImages.forEach(image => {
        const newSelectableImageButton = document.createElement('img')
        newSelectableImageButton.setAttribute('src', image.webviewUri)
        newSelectableImageButton.setAttribute('file', image.fileName)
        newSelectableImageButton.addEventListener('click', (e) => {
          if (e.button == 0) {
            this._vscodeApi.postMessage({
              command: 'selectable-image-clicked',
              text: newSelectableImageButton.getAttribute('file'),
              imageType: event.data.imageType
            })
          }
          else if (e.button == 1) {
            console.log('right button!')
          }
        })
        newSelectableImageButton.addEventListener('mouseover', (e) => {
          this._hoveredImage.setAttribute('src', newSelectableImageButton.getAttribute('src'))
          this._hoveredImageText.textContent = this.removeFileExtension(newSelectableImageButton.getAttribute('file'))
        });
        newSelectableImageButton.addEventListener('mouseout', (e) => {
          this._hoveredImage.setAttribute('src', '')
          this._hoveredImageText.textContent = ''
        });
          newSelectableImageButton.classList.remove('selected')
        if (image.fileName == this._currentImage.getAttribute('file')) {
          newSelectableImageButton.classList.add('selected')
        }
        this._selectableImagesContainer.appendChild(newSelectableImageButton)
      })
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
