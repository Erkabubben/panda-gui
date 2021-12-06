/**
 * The main script file of the application.
 *
 * @author Johan Leitet <johan.leitet@lnu.se>
 * @author Mats Loock <mats.loock@lnu.se>
 * @version 1.0.0
 */

import './components/bart-board/'

// TODO: Use this file to experiment with the bart-board.
const bartboard = document.querySelector('bart-board')
bartboard.addEventListener('filled', () => { bartboard.clear(); console.log('Board is full - wiping!') })
