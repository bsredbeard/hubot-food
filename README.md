# hubot-food

A hubot script to help you take food orders more easily for you group.

## Installation

1. Install via NPM: `npm install hubot-food --save`
2. Add a line to your `external-scripts.json` for `"hubot-food"`
3. Deploy/Run your hubot

## Usage

`@hubot food start "{order name}"[ from {some restaurant}]`
start a food order

`@hubot food for "{order name}" get me {your order}`
add or modify your order

`@hubot food check "{order name}"`
prints out the current order list

`@hubot food end "{order name}"`
prints out the current order list and stops taking orders

### Notes

* There is no persistence for ordering. Restart the bot and your orders are gone.
* Order names allow you to track orders in multiple rooms or multiple orders in the same room.
* Bot is very noisy and uses `@all` in the room when you start an order.

## Environment

No environment variables needed

## License

Licensed under the [MIT License](./LICENSE)