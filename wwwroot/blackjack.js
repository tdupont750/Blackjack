// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
// Object.seal()
// Object.freeze()

(function (win) {
	'strict';
		
	const NumNames = Object.freeze(['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']);

	const State = Object.freeze({
		None: 0,
		Start: 1,
		Char1: 2,
		Char2: 3,
		Dealer: 4,
		End: 5
	});
	
	const self = {
		deck: createDeck(),
		main: win.document.querySelector('#main'),
		dealer: {
			name: 'Dealer',
			hp: 20,
			maxHp: 20,
			hand: {
				cards: [],
				nameEl: win.document.querySelector('#dealer > .name'),
				el: win.document.querySelector('#dealer > .cards'),
				sum: win.document.querySelector('#dealer > .sum')
			}
		},
		player: {
			hp: 10,
			maxHp: 10,
		},
		char1: {
			name: 'Player 1',
			hand: {
				cards: [],
				nameEl: win.document.querySelector('#char1 > .name'),
				el: win.document.querySelector('#char1 > .cards'),
				sum: win.document.querySelector('#char1 > .sum')
			}
		},
		char2: {
			name: 'Player 2',
			hand: {
				cards: [],
				nameEl: win.document.querySelector('#char2 > .name'),
				el: win.document.querySelector('#char2 > .cards'),
				sum: win.document.querySelector('#char2 > .sum')
			}
		},
		state: State.None,
	};
	
	init();
	
	return self;
	
	function init() {
		win.document.querySelector('#switch').onclick = onSwitch;
		win.document.querySelector('#continue').onclick = onContinue;
		
		win.document.querySelector('#hit').onclick = onHit;
		win.document.querySelector('#stay').onclick = onStay;
		
		win.document.querySelector('#deal').onclick = onDeal;
		
		advanceTurn();
	}
	
	function onSwitch() {
		console.log('onSwitch');
		
		let c1 = pop(self.char1.hand);
		let c2 = pop(self.char2.hand);
		
		dealCard(self.char1.hand, c2.hide, c2.card);
		dealCard(self.char2.hand, c1.hide, c1.card);
		
		function pop(hand) {
			let card = hand.cards.pop();
			hand.el.removeChild(hand.el.lastChild);
			return card;
		}
	}
	
	function onContinue() {
		console.log('onContinue');
		advanceTurn();
	}
	
	function onHit() {
		console.log('onHit');
		
		switch(self.state) {
			case State.Char1:
				hit(self.char1);
				break;
				
			case State.Char2:
				hit(self.char2);
				break;
			
			default:
				throw 'Invalid State';
		}
		
		function hit(c) {
			let total = dealCard(c.hand);
			if (total >= 21) {
				advanceTurn();
			}
		}
	}
	
	function onStay() {
		console.log('onStay');
		advanceTurn();
	}
	
	function onDeal() {
		console.log('onDeal');
		win.location.reload();
	}
	
	function advanceTurn() {
		switch(self.state) {
			case State.None:
				self.main.classList.add('state-start');
				self.state = State.Start;
				dealAll();
				break;
				
			case State.Start:
				self.main.classList.remove('state-start');
				self.main.classList.add('state-char1');
				self.state = State.Char1;
				break;
				
			case State.Char1:
				self.main.classList.remove('state-char1');
				self.main.classList.add('state-char2');
				self.state = State.Char2;
				break;
				
			case State.Char2:
				self.main.classList.remove('state-char2');
				self.main.classList.add('state-dealer');
				self.state = State.Dealer;
				dealerTurn();
				break;
				
			case State.Dealer:
				self.main.classList.remove('state-dealer');
				self.main.classList.add('state-end');
				self.state = State.End;
				endGame();
				break;
			
			default:
				throw 'Invalid State';
		}
	}
	
	function endGame() {
		let dt = sumHand(self.dealer.hand, true);
		let ct1 = sumHand(self.char1.hand, true);
		let ct2 = sumHand(self.char2.hand, true);
		
		charEndGame(ct1, self.char1.hand.nameEl);
		charEndGame(ct2, self.char2.hand.nameEl);
		
		function charEndGame(ct, el) {
			if (ct > 21) {
				return;
			}
			
			let cl = 'lose';
			
			if (dt > 21 || ct > dt) {
				cl = 'win';
			} else if (dt == ct) {
				cl = 'push';
			}
			
			el.classList.add(cl);
		}
	}
		
	function dealerTurn() {
		reveal(self.dealer.hand);
	
		while (true) {
			let total = sumHand(self.dealer.hand);	
			if (total >= 17) {
				break;
			} 
			total = dealCard(self.dealer.hand);
		}
		
		advanceTurn();
	}
	
	function dealAll() {
		dealCard(self.char1.hand);
		dealCard(self.char2.hand);
		dealCard(self.dealer.hand, true);
		dealCard(self.char1.hand);
		dealCard(self.char2.hand);
		dealCard(self.dealer.hand);
	}
	
	function reveal(hand) {
		let els = hand.el.querySelectorAll(".hidden");
		for (let i=0; i<els.length; i++) {
			els[i].classList.remove('hidden');
		}
		for(let i=0; i<hand.cards.length; i++) {
			hand.cards[i].hide = false;
		}
	}
	
	function dealCard(hand, hide, card) {
		if (!card) {
			card = self.deck.shift();
		}
		hand.cards.push({
			card,
			hide
		});
		let hideClass = hide === true ? 'class="hidden"' : '';
		let cardEl = createEl('<div ' + hideClass + '><span data-suite="' + card.suite + '">' + card.abrv + '</span></div>');
		hand.el.appendChild(cardEl);
		
		return sumHand(hand);
	}
	
	function sumHand(hand, readOnly) {
		let total = 0;
		let visible = 0;
		let hiding = false;
		
		for(let i=0; i<hand.cards.length; i++) {
			let card = hand.cards[i].card;
			let value = card.value;
			
			if (card.altValue && total + card.value > 21) {
				value = card.altValue;
			}
			
			total += value;
			
			if (hand.cards[i].hide) {
				hiding = true;
			}  else {
				visible += value;
			}
		}
		
		if (readOnly !== true) {
			let txt = visible.toString();
			if (hiding) {
				txt = '> ' + txt;
			}
			if (visible > 21) {
				txt += ' BUST';
				hand.nameEl.classList.add('bust');
			}
			hand.sum.innerText = txt;
		}
		
		return total;
	}
	
	// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
	function createEl(html) {
		let template = document.createElement('template');
		template.innerHTML = html.trim(); // Never return a text node of whitespace as the result;
		return template.content.firstChild;
	}
		
	function createDeck() {
		let a = [];
		for (let d = 1; d < 5; d++) {
			for (let s = 1; s < 4; s++) {
				for (let c = 1; c < 11; c++) {
					a.push({
						suite: s,
						name: NumNames[c],
						abrv: c.toString(),
						value: c
					});
				}
				a.push({
					suite: s,
					name: 'Jack',
					abrv: 'J',
					value: 10,
				});
				a.push({
					suite: s,
					name: 'Queen',
					abrv: 'Q',
					value: 10,
				});
				a.push({
					suite: s,
					name: 'King',
					abrv: 'K',
					value: 10,
				});
				a.push({
					suite: s,
					name: 'Ace',
					abrv: 'A',
					value: 11,
					altValue: 1
				});
			}
		}
		return shuffle(a);
	}
	
	// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
	function shuffle(array) {
		let currentIndex = array.length,
		temporaryValue,
		randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

})(window);