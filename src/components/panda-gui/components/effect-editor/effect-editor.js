/**
 * The bart-board web component module.
 *
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
      padding:4px;
      border:2px solid grey;
      margin:4px;
      float:left;
      border-radius: 2px;
      user-select: none;
    }
    p {
      margin: 0;
      padding: 0;
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
`

/**
* Define custom element.
*/
customElements.define('effect-editor',
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

      console.log('EFFECT EDITOR FOUND!')

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

      this.style.display = 'none'

      // Message Events
      window.addEventListener('message', event => {
        if (event.data.command == 'set-state') {
          this.style.display = 'none'
          if (event.data.state == 'cinematic-effect-state') {
            this.style.display = ''
          }
        }

        if (event.data.command == 'set-edit-effect-image') {
          this.setEditEffectImage(event)
        }
      })
    }

    SetVSCodeApiInstance (vscodeApiInstance) {
      this._vscodeApi = vscodeApiInstance
    }

    sliderSetup (querySelector, controlName, valueModifier) {
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
