# &lt;bart-board&gt;
A web component used to simulate the intro scene from Simpsons, were Bart is writing on the black board.

## Attributes

### `text`
A String attribute; that, if specified, contains the text that will be written out, letter by letter, on the black board.

Default value: `I will never ever skip the line in the task queue again.`

### `speed`
A Number indicating the speed in milliseconds, of which the letters will appear on the screen. 

Default value: `50`

## Methods

### `clear()`
A method that when called will clear the text written on the board.

Parameters: none

Returns: Reference to self.

### `stopWriting()`
When called, will stop writing of the board.

Parameters: none

Returns: Reference to self.

## Events
| Event Name | Fired When |
|------------|------------|
| `filled`| The board is filled with text.

## Styling with CSS
The text (p-element) is styleable using the part `text`

## Example
```html
   <bart-board text="This is the text that will be written" speed="50"></bart-board>
```

![Example of the functions of the bart-board](./.readme/example.gif)
