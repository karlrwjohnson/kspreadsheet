class Document extends Observable {
	constructor (tables) {
		super();
		this._tables = new Set();

		for (let table of (tables || [])) {
			this.addTable(table);
		}
	}

	addTable (_) {
		this._tables.add(_);
		this.notify('addTable', _);
	}

	removeTable (_) {
		this._tables.delete(_);
		this.notify('removeTable', _);
	}
}
