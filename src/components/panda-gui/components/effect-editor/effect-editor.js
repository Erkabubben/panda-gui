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
    #edit-effect-start-frame {
      position: absolute;
      border: 2px solid green;
    }
    #edit-effect-end-frame {
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
    #edit-effect-controls table .start-control {
      background-color: green;
    }
    #edit-effect-controls table .end-control {
      background-color: red;
    }
    #edit-effect-controls table label {
      width: 32px;
    }
  </style>
  <style id="edit-effect-start-frame-style"></style>
  <style id="edit-effect-end-frame-style"></style>
  <style id="preview-effect-style"></style>
  <style id="preview-effect-animation-style"></style>
  <div id="cinematic-effect-state">
    <div id="preview-effect-container">
      <img id="preview-effect-image" src="./test-image.jpg">
    </div>
    <div id="edit-effect-container">
      <img id="edit-effect-image" src="./test-image.jpg">
      <div id="edit-effect-start-frame"></div>
      <div id="edit-effect-end-frame"></div>
    </div>
    <div id="edit-effect-controls">
      <label for="duration">Duration</label>
      <input type="range" name="duration" min="0" max="200" value="50" class="slider" id="duration-slider">
      <table>
        <tr>
          <th></th>
          <th class="start-control">Start<button class="copy-all-button">></button></th>
          <th class="end-control"><button class="copy-all-button"><</button>End</th>
        </tr>
        <tr>
          <td>Zoom</td>
          <td class="start-control">
            <input type="range" min="10" max="50" value="10" class="slider" id="start-zoom-slider">
            <button targetslider="#end-zoom-slider" class="copy-button">></button>
          </td>
          <td class="end-control">
            <button targetslider="#start-zoom-slider" class="copy-button"><</button>
            <input type="range" min="10" max="50" value="10" class="slider" id="end-zoom-slider">
          </td>
        </tr>
        <tr>
          <td>X</td>
          <td class="start-control">
            <input type="range" min="0" max="100" value="50" class="slider" id="start-pos-x-slider">
            <button targetslider="#end-pos-x-slider" class="copy-button">></button>
          </td>
          <td class="end-control">
            <button targetslider="#start-pos-x-slider" class="copy-button"><</button>
            <input type="range" min="0" max="100" value="50" class="slider" id="end-pos-x-slider">
          </td>
        </tr>
        <tr>
          <td>Y</td>
          <td class="start-control">
            <input type="range" min="0" max="100" value="50" class="slider" id="start-pos-y-slider">
            <button targetslider="#end-pos-y-slider" class="copy-button">></button>
          </td>
          <td class="end-control">
            <button targetslider="#start-pos-y-slider" class="copy-button"><</button>
            <input type="range" min="0" max="100" value="50" class="slider" id="end-pos-y-slider">
          </td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </table>
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
      this._editEffectStartFrameStyle = this.shadowRoot.querySelector('style#edit-effect-start-frame-style')
      this._editEffectEndFrameStyle = this.shadowRoot.querySelector('style#edit-effect-end-frame-style')

      this._sliders = []

      this._durationSlider = this.sliderSetup('#duration-slider', 0, 0.1)
      this._startZoomSlider = this.sliderSetup('#start-zoom-slider', 1, 0.1)
      this._startPosXSlider = this.sliderSetup('#start-pos-x-slider', 2, 0.01)
      this._startPosYSlider = this.sliderSetup('#start-pos-y-slider', 3, 0.01)
      this._endZoomSlider = this.sliderSetup('#end-zoom-slider', 4, 0.1)
      this._endPosXSlider = this.sliderSetup('#end-pos-x-slider', 5, 0.01)
      this._endPosYSlider = this.sliderSetup('#end-pos-y-slider', 6, 0.01)

      this.updateSliderValueLabels()

      this.copyButtonsSetup(this.shadowRoot.querySelectorAll('#edit-effect-controls table tr .copy-button'))
      this._startZoomSlider.on

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

    copyButtonsSetup (buttons) {
      buttons.forEach(button => {
        button.addEventListener("click", () => {
          let targetSlider = this.shadowRoot.querySelector(button.getAttribute('targetslider'))
          let fromSlider = button.parentNode.querySelector('input')
          targetSlider.value = fromSlider.value
          targetSlider.onchange()
        })
      })
    }

    sliderSetup (querySelector, paramNumber, valueModifier) {
      const slider = this._cinematicEffectState.querySelector(querySelector)
      const valueLabel = document.createElement('label')
      const name = querySelector[0] == '#' ? querySelector.slice(1) : querySelector
      valueLabel.setAttribute('for', name)
      slider.setAttribute('name', name)
      slider.parentNode.insertBefore(valueLabel, slider.nextSibling)
      slider.onchange = () => {
        this._vscodeApi.postMessage({
          command: 'effect-slider-change',
          paramNumber: paramNumber,
          value: slider.value * valueModifier
        })
      }
      slider.oninput = () => {
        valueLabel.textContent = (slider.value * valueModifier).toFixed(2)
        this.updateEditEffectFrameStyles()
        this.updatePreviewEffectStyle()
      }
      this._sliders.push( { slider: slider, valueLabel: valueLabel, valueModifier: valueModifier })
      return slider
    }

    updateSliderValueLabels () {
      this._sliders.forEach(obj => {
        obj.valueLabel.textContent = String((obj.slider.value * obj.valueModifier).toFixed(2))
      })
    }

    setEditEffectImage (event) {
      let params = {
        duration: event.data.lineContent.params[0],
        startZoom: event.data.lineContent.params[1],
        startX: event.data.lineContent.params[2],
        startY: event.data.lineContent.params[3],
        endZoom: event.data.lineContent.params[4],
        endX: event.data.lineContent.params[5],
        endY: event.data.lineContent.params[6],
      }

      this._durationSlider.value = params.duration * 10

      if (event.data.lineContent.params.length > 1) {
        this._startZoomSlider.value = params.startZoom  * 10
      }
      if (event.data.lineContent.params.length > 2) {
        this._startPosXSlider.value = params.startX * 100
      }
      if (event.data.lineContent.params.length > 3) {
        this._startPosYSlider.value = params.startY * 100
      }
      if (event.data.lineContent.params.length > 4) {
        this._endZoomSlider.value = params.endZoom  * 10
      }
      if (event.data.lineContent.params.length > 5) {
        this._endPosXSlider.value = params.endX * 100
      }
      if (event.data.lineContent.params.length > 6) {
        this._endPosYSlider.value = params.endY * 100
      }

      this._editEffectImage.setAttribute('src', event.data.image.Uri)
      this._previewEffectImage.setAttribute('src', event.data.image.Uri)

      this.updateSliderValueLabels()

      this.updateEditEffectFrameStyles()
      this.updatePreviewEffectStyle()
    }

    updateEditEffectFrameStyles () {
      let startZoom = (1 / (this._startZoomSlider.value / 10)) * 100
      let startX = this.GetFramePositionFromZoomAndSlider(startZoom, this._startPosXSlider)
      let startY = this.GetFramePositionFromZoomAndSlider(startZoom, this._startPosYSlider)

      let endZoom = (1 / (this._endZoomSlider.value / 10)) * 100
      let endX = this.GetFramePositionFromZoomAndSlider(endZoom, this._endPosXSlider)
      let endY = this.GetFramePositionFromZoomAndSlider(endZoom, this._endPosYSlider)

      this._editEffectStartFrameStyle.textContent = `
      #edit-effect-start-frame {
        transform: translate(-50%, 50%);
        width: ${startZoom}%;
        height: ${startZoom}%;
        left: ${startX}%;
        bottom: ${startY}%;
      }
      #edit-effect-end-frame {
        transform: translate(-50%, 50%);
        width: ${endZoom}%;
        height: ${endZoom}%;
        left: ${endX}%;
        bottom: ${endY}%;
      }
      `
    }

    GetFramePositionFromZoomAndSlider (zoom, slider) {
      let positionDifference = (100 - zoom)
      let positionLowest = 50 - (positionDifference / 2)
      return positionLowest + ((slider.value * 0.01) * positionDifference)
    }

    GetPreviewImagePositionFromZoomAndSlider (zoom, slider) {
      let positionDifference = (100 - zoom)
      let positionHighest = 50 + (positionDifference / 2)
      return positionHighest - ((1 - (slider.value * 0.01)) * positionDifference)
    }

    updatePreviewEffectStyle () {
      let previewImageStartZoom = (this._startZoomSlider.value / 10) * 100
      let previewImageStartX = this.GetPreviewImagePositionFromZoomAndSlider(previewImageStartZoom, this._startPosXSlider)
      let previewImageStartY = this.GetPreviewImagePositionFromZoomAndSlider(previewImageStartZoom, this._startPosYSlider)

      let previewImageEndZoom = (this._endZoomSlider.value / 10) * 100
      let previewImageEndX = this.GetPreviewImagePositionFromZoomAndSlider(previewImageEndZoom, this._endPosXSlider)
      let previewImageEndY = this.GetPreviewImagePositionFromZoomAndSlider(previewImageEndZoom, this._endPosYSlider)

      let duration = this._durationSlider.value * 0.1

      this._previewEffectStyle.textContent = `#preview-effect-image {
        transform: translate(-50%, 50%);
        width: ${previewImageStartZoom}%;
        height: ${previewImageStartZoom}%;
        bottom: ${previewImageStartX}%;
      }`

      this._previewEffectAnimationStyle.textContent = `
      @keyframes preview-effect-animation {
        from {
          width: ${previewImageStartZoom}%;
          height: ${previewImageStartZoom}%;
          left: ${previewImageStartX}%;
          bottom: ${previewImageStartY}%;
        }
        to {
          width: ${previewImageEndZoom}%;
          height: ${previewImageEndZoom}%;
          left: ${previewImageEndX}%;
          bottom: ${previewImageEndY}%;
        }
      }
      #preview-effect-image {
        animation-name: preview-effect-animation;
        animation-duration: ${duration}s;
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
