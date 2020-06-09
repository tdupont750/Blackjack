// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
// Object.seal()
// Object.freeze()

(async function blackjackAync(win) {
	'strict';
	
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
		container: win.document.querySelector('.grid-container'),
		dealer: createChar('#dealer'),
		char1: createChar('#char1'),
		char2: createChar('#char2'),
		state: State.None,
	};
	
	await initAsync();
	
	return self;
	
	async function initAsync() {
		win.document.querySelector('#switch').onclick = onSwitchAsync;
		win.document.querySelector('#continue').onclick = onContinueAsync;
		win.document.querySelector('#hit').onclick = onHitAsync;
		win.document.querySelector('#stay').onclick = onStayAsync;
		win.document.querySelector('#deal').onclick = onDeal;
		await advanceTurnAsync();
	}
	
	function animateAsync(el, cls) {
		return new Promise(resolve => {
			el.classList.add(cls);
			el.addEventListener('animationend', onAnimationEnd);
			
			function onAnimationEnd() {
				el.classList.remove(cls);
				el.removeEventListener('animationend', onAnimationEnd);
				resolve();
			}
		});
	}
	
	function createChar(id) {
		return {
			cards: [],
			nameEl: win.document.querySelector(id + ' > div:first-child'),
			cardsEl: win.document.querySelector(id + ' .grid-cards')
		};
	}
	
	async function onSwitchAsync() {
		console.log('onSwitchAsync');
		
		let p1 = popAsync(self.char1, 'switch-out-right');
		let p2 = popAsync(self.char2, 'switch-out-left');
		
		let c1 = await p1;
		let c2 = await p2;
		
		p1 = dealCardAsync(self.char1, c2.hide, c2.card, 'switch-in-right');
		p2 = dealCardAsync(self.char2, c1.hide, c1.card, 'switch-in-left');
		
		await p1;
		await p2;
		
		async function popAsync(hand, animation) {
			let card = hand.cards.pop();
			let last = hand.cardsEl.querySelector('div:last-child');
			if (last) {
				await animateAsync(last, animation);
				hand.cardsEl.removeChild(last);	
			}
			return card;
		}
	}
	
	async function onContinueAsync() {
		console.log('onContinueAsync');
		await advanceTurnAsync();
	}
	
	async function onHitAsync() {
		console.log('onHit');
		
		switch(self.state) {
			case State.Char1:
				await hitAsync(self.char1);
				break;
				
			case State.Char2:
				await hitAsync(self.char2);
				break;
			
			default:
				throw 'Invalid State';
		}
		
		async function hitAsync(hand) {
			let sum = await dealCardAsync(hand);
			await tryAutoAdvanceTurnAsync(hand, sum);
		}
	}
	
	async function onStayAsync() {
		console.log('onStayAsync');
		await advanceTurnAsync();
	}
	
	function onDeal() {
		console.log('onDeal');
		win.location.reload();
	}
	
	async function advanceTurnAsync() {
		switch(self.state) {
			case State.None:
				await dealAllAsync();
				self.container.classList.add('state-start');
				self.state = State.Start;
				await tryAutoAdvanceSwitchAsync();
				break;
				
			case State.Start:
				self.container.classList.remove('state-start');
				self.container.classList.add('state-char1');
				self.state = State.Char1;
				await tryAutoAdvanceTurnAsync(self.char1);
				break;
				
			case State.Char1:
				await tryRemoveEmptyAsync(self.char1);
				self.container.classList.remove('state-char1');
				self.container.classList.add('state-char2');
				self.state = State.Char2;
				await tryAutoAdvanceTurnAsync(self.char2);
				break;
				
			case State.Char2:
			await tryRemoveEmptyAsync(self.char2);
				self.container.classList.remove('state-char2');
				self.container.classList.add('state-dealer');
				self.state = State.Dealer;
				await dealerTurnAsync();
				break;
				
			case State.Dealer:
				self.container.classList.remove('state-dealer');
				self.container.classList.add('state-end');
				self.state = State.End;
				endGame();
				break;
			
			default:
				throw 'Invalid State';
		}
	
		async function tryAutoAdvanceSwitchAsync() {
			if (self.char1.cards[0].card.equality === self.char2.cards[0].card.equality ||
				self.char1.cards[1].card.equality === self.char2.cards[1].card.equality) {
				await advanceTurnAsync();
			}
			
		}
	}
	
	async function tryAutoAdvanceTurnAsync(hand, sum = 0) {
		if (sum === 0) {
			sum = sumHand(hand, true);
		}
		if (sum >= 21) {
			await advanceTurnAsync();
		} else {
			await tryAddEmptyAsync(hand);
		}
	}
	
	function endGame() {
		let dt = sumHand(self.dealer, true);
		let ct1 = sumHand(self.char1, true);
		let ct2 = sumHand(self.char2, true);
		
		charEndGame(ct1, self.char1.nameEl);
		charEndGame(ct2, self.char2.nameEl);
		
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
		
	async function dealerTurnAsync() {
		await revealAsync(self.dealer);
	
		while (true) {
			let total = sumHand(self.dealer);	
			if (total >= 17) {
				break;
			} 
			total = await dealCardAsync(self.dealer);
		}
		
		await advanceTurnAsync();
	}
	
	async function dealAllAsync() {
		await dealCardAsync(self.char1);
		await dealCardAsync(self.char2);
		await dealCardAsync(self.dealer, true);
		await dealCardAsync(self.char1);
		await dealCardAsync(self.char2);
		await dealCardAsync(self.dealer);
	}
	
	async function revealAsync(hand) {
		let els = hand.cardsEl.querySelectorAll(".facedown");
		for (let i=0; i<els.length; i++) {
			els[i].classList.remove('facedown');
			await animateAsync(els[i], 'faceup');
		}
		for(let i=0; i<hand.cards.length; i++) {
			hand.cards[i].hide = false;
		}
	}
	
	async function tryAddEmptyAsync(hand) {
		let last = hand.cardsEl.querySelector('div:last-child:empty');
		if(!last) {
			let el = createEl('<div>');
			hand.cardsEl.appendChild(el);
			await animateAsync(el, 'fade-in');
		}
	}
		
	async function tryRemoveEmptyAsync(hand) {
		let last = hand.cardsEl.querySelector('div:last-child:empty');
		if (last) {
			await animateAsync(last, 'fade-out');
			hand.cardsEl.removeChild(last);
		}
	}
	
	async function dealCardAsync(hand, hide, card, animation = 'deal-card') {
		if (!card) {
			card = self.deck.shift();
		}
		hand.cards.push({
			card,
			hide
		});
		
		await tryRemoveEmptyAsync(hand);
		
		let hideClass = hide === true ? 'class="facedown"' : '';
		let cardEl = createEl('<div ' + hideClass + '><span data-suite="' + card.suite + '"></span>' + card.abrv + '</div>');
		hand.cardsEl.appendChild(cardEl);
		await animateAsync(cardEl, animation);
		
		return sumHand(hand);
	}
	
	function sumHand(hand, readOnly) {
		let total = sumHandWithVisiblity(true);
		
		if (readOnly === true) {
			return total;
		}
		
		let visible = sumHandWithVisiblity(false);
		let txt = visible.toString();
		
		if (total !== visible) {
			txt = '> ' + txt;
		}
		
		if (visible > 21) {
			txt += ' BUST';
			hand.nameEl.classList.add('bust');
		}
		
		console.log(txt);
		return total;
		
		function sumHandWithVisiblity(showAll) {
			let sum = 0;
			let addTen = false;
			
			for(let i=0; i<hand.cards.length; i++) {
				let card = hand.cards[i].card;
				
				if (showAll || hand.cards[i].hide !== true) {
					if (card.equality === 11) {
						addTen = true;
					}
				
					sum += card.value;
				}
			}
			
			if (addTen && sum <= 11) {
				sum += 10;
			}
			
			return sum;
		}
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
			for (let s = 1; s < 5; s++) {
				for (let c = 1; c < 11; c++) {
					a.push({
						suite: s,
						abrv: c.toString(),
						value: c,
						equality: c
					});
				}
				a.push({
					suite: s,
					abrv: 'J',
					value: 10,
					equality: 10
				});
				a.push({
					suite: s,
					abrv: 'Q',
					value: 10,
					equality: 10
				});
				a.push({
					suite: s,
					abrv: 'K',
					value: 10,
					equality: 10
				});
				a.push({
					suite: s,
					abrv: 'A',
					value: 1,
					equality: 11
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