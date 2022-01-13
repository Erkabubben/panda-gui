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
    #image-select-top-container {
      display: inline-block;
      border: 2px solid grey;
      height: 200px;
      overflow: hidden;
      white-space: nowrap;
    }
    #image-select-top-container div {
      position: relative;
      height: 200px;
    }
    #image-select-top-container div#top-left-container {
      float:left;
    }
    #image-select-top-container div#top-right-container {
      float:left;
    }
    #image-select-top-container div img {
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
    #cinematic-effect-state {
      width: 100%;
      padding: 0px;
    }
    #edit-effect-container {
      position: relative;
      padding: 0px;
      margin: 0px;
    }
    #edit-effect-image {
      position: relative;
      width: 100%;
    }
    #edit-effect-start-borders {
      position: absolute;
      border: 2px solid red;
    }
    #edit-effect-end-borders {
      position: absolute;
      border: 2px solid red;
    }
    #edit-effect-start-margin-line, #edit-effect-end-margin-line {
      position: absolute;
      border-left: 3px solid green;
      height: 100%;
      top: 0px;
    }
    #preview-effect-container {
      position: relative;
      overflow: hidden;
      height: 200px;
      width: 354px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 4px;
    }
    #preview-effect-image {
      position: absolute;
      width: 100%;
    }
  </style>
  <style id="edit-effect-start-borders-style"></style>
  <style id="edit-effect-end-borders-style"></style>
  <style id="preview-effect-style"></style>
  <style id="preview-effect-animation-style"></style>
  <div id="file-operations-container">
    <input id="file-input" type="file" webkitdirectory directory multiple>
    <button id="rename-to-3-digits-button">Rename to 3 Digits</button>
  </div>
  <div id="cinematic-effect-state">
    <div id="preview-effect-container">
      <img id="preview-effect-image" src="./test-image.jpg">
    </div>
    <div id="edit-effect-container">
      <img id="edit-effect-image" src="./test-image.jpg">
      <div id="edit-effect-start-borders"></div>
      <div id="edit-effect-end-borders"></div>
    </div>
    <div id="edit-effect-controls">
      <input type="range" min="0" max="100" value="50" class="slider" id="duration-slider">
      <input type="range" min="10" max="50" value="10" class="slider" id="zoom-slider">
      <input type="range" min="0" max="100" value="50" class="slider" id="position-slider">
      <input type="range" min="0" max="100" value="0" class="slider" id="start-margin-slider">
      <input type="range" min="0" max="100" value="0" class="slider" id="end-margin-slider">
    </div>
  </div>
  <div id="image-select-top-container">
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
      this._workspaceFolder = '';
      this._vscodeApi = acquireVsCodeApi();

      // Cinematic Select State and Portrait Select State
      this._imageSelectTopContainer = this.shadowRoot.querySelector('#image-select-top-container')
      this._currentImage = this.shadowRoot.querySelector('img#current-image')
      this._currentImageText = this.shadowRoot.querySelector('#current-image-text')
      this._hoveredImage = this.shadowRoot.querySelector('img#hovered-image')
      this._hoveredImageText = this.shadowRoot.querySelector('#hovered-image-text')

      this._selectableImagesContainer = this.shadowRoot.querySelector('#selectable-images-container')

      // File renaming field
      this._selectFileInput = this.shadowRoot.querySelector('#file-input')
      this._lastSelectedFiles = null
      this._renameTo3DigitsButton = this.shadowRoot.querySelector('#rename-to-3-digits-button')

      // Cinematic Effect State
      this._cinematicEffectState = this.shadowRoot.querySelector('#cinematic-effect-state')

      // Edit Effect
      this._editEffectImage = this._cinematicEffectState.querySelector('#edit-effect-image')
      this._editEffectStartBordersStyle = this.shadowRoot.querySelector('style#edit-effect-start-borders-style')
      this._editEffectEndBordersStyle = this.shadowRoot.querySelector('style#edit-effect-end-borders-style')

      this._durationSlider = this.sliderSetup('#duration-slider', 'duration', 0.1)
      this._zoomSlider = this.sliderSetup('#zoom-slider', 'zoom', 0.1)
      this._positionSlider = this.sliderSetup('#position-slider', 'position', 0.01)
      this._startMarginSlider = this.sliderSetup('#start-margin-slider', 'start-margin', 0.01)
      this._endMarginSlider = this.sliderSetup('#end-margin-slider', 'end-margin', 0.01)

      // Preview Effect
      this._previewEffectImage = this._cinematicEffectState.querySelector('#preview-effect-image')
      this._previewEffectStyle = this.shadowRoot.querySelector('style#preview-effect-style')
      this._previewEffectAnimationStyle = this.shadowRoot.querySelector('style#preview-effect-animation-style')

      // Message Events
      window.addEventListener('message', event => {

        if (event.data.command == 'set-state') {
          this._imageSelectTopContainer.style.display = 'none'
          this._selectableImagesContainer.style.display = 'none'
          this._cinematicEffectState.style.display = 'none'
          if (event.data.state == 'cinematic-select-state' || event.data.state == 'portrait-select-state') {
            this._imageSelectTopContainer.style.display = ''
            this._selectableImagesContainer.style.display = ''
          }
          if (event.data.state == 'cinematic-effect-state') {
            this._cinematicEffectState.style.display = ''
          }
        }

        if (event.data.command == 'update-current-image') {
          this.updateCurrentImage(event)
        } else if (event.data.command == 'set-workspace-folder') {
          this._workspaceFolder = event.data.workspaceFolder
        } else if (event.data.command == 'no-selection') {
          this._currentImage.removeAttribute('src')
        } else if (event.data.command == 'update-selectable-images') {
          this.updateSelectableImages(event)
        } else if (event.data.command == 'set-edit-effect-image') {
          this.setEditEffectImage(event)
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

    sliderSetup(querySelector, controlName, valueModifier) {
      let slider = this._cinematicEffectState.querySelector(querySelector)
      slider.onchange = () => {
        this._vscodeApi.postMessage({
          command: 'effect-slider-change',
          control: controlName,
          value: slider.value * valueModifier
        })
      }
      slider.oninput = () => { this.updateEditEffectBordersStyle(), this.updatePreviewEffectStyle() }
      return slider
    }

    setEditEffectImage (event) {
      let params = {
        duration: event.data.lineContent.params[0],
        zoom: event.data.lineContent.params[1],
        position: event.data.lineContent.params[2],
        startMargin: event.data.lineContent.params[3],
        endMargin: event.data.lineContent.params[4]
      }

      this._durationSlider.value = params.duration

      if (event.data.lineContent.params.length > 1) {
        this._zoomSlider.value = params.zoom  * 10
      }
      if (event.data.lineContent.params.length > 2) {
        this._positionSlider.value = params.position * 100
      }
      if (event.data.lineContent.params.length > 3) {
        this._startMarginSlider.value = params.startMargin * 100
      }
      if (event.data.lineContent.params.length > 4) {
        this._endMarginSlider.value = params.endMargin * 100
      }

      this._editEffectImage.setAttribute('src', event.data.image.Uri)
      this._previewEffectImage.setAttribute('src', event.data.image.Uri)

      this.updateEditEffectBordersStyle()
    }

    updateEditEffectBordersStyle () {
      let bordersZoom = (1 / (this._zoomSlider.value / 10)) * 100
      let bordersPos = 50

      let positionDifference = (100 - bordersZoom)
      let positionLowest = 50 - (positionDifference / 2)
      bordersPos = positionLowest + ((this._positionSlider.value * 0.01) * positionDifference)

      let startMargin = this._startMarginSlider.value
      let endMargin = this._endMarginSlider.value

      this._editEffectStartBordersStyle.textContent = `
      #edit-effect-start-borders {
        transform: translate(-50%, 50%);
        width: ${bordersZoom}%;
        height: ${bordersZoom}%;
        bottom: ${bordersPos}%;
        left: 50%;
      }
      #edit-effect-start-margin-line {
        right: ${startMargin}%;
      }
      #edit-effect-end-margin-line {
        left: ${endMargin}%;
      }
      `
    }

    updatePreviewEffectStyle () {
      let previewImageZoom = (this._zoomSlider.value / 10) * 100
      let previewImagePos = 50

      let positionDifference = (100 - previewImageZoom)
      let positionHighest = 50 + (positionDifference / 2)
      previewImagePos = positionHighest - ((1 - (this._positionSlider.value * 0.01)) * positionDifference)

      this._previewEffectStyle.textContent = `#preview-effect-image {
        transform: translate(-50%, 50%);
        width: ${previewImageZoom}%;
        height: ${previewImageZoom}%;
        bottom: ${previewImagePos}%;
      }`

      let animPositionDifference = (100 - previewImageZoom)
      let animPositionHighest = 50 + (animPositionDifference / 2)
      let animPositionLowest = 50 - (animPositionDifference / 2)

      this._previewEffectAnimationStyle.textContent = `
      @keyframes preview-effect-animation {
        from {
          left: ${animPositionHighest}%;
        }
        to {
          left: ${animPositionLowest}%;
        }
      }
      #preview-effect-image {
        animation-name: preview-effect-animation;
        animation-duration: 7s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
      }`
    }

    updateCurrentImage (event) {
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
