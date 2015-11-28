'use strict';

xdescribe('kspreadsheet', ()=>{

  const EM_SIZE = 16;

  let doc;
  let documentController
  let topLeftInput;

  const TAB_KEY_EVENT_INIT = {
    keyCode: TAB_KEY_CODE,
  };
  const SHIFT_TAB_KEY_EVENT_INIT = {
    keyCode: TAB_KEY_CODE,
    shiftKey: true,
  };


  beforeEach(()=>{
    doc = new Document();
    documentController = new DocumentController(doc);

    // Set initial styles
    documentController.tableContainer.style.fontSize = EM_SIZE + 'px';
  });

  it('should initialize a blank document', ()=>{
    const tables = Array.from(doc.tables);
    expect(tables.length).toBe(0);
  });

  it('should create a table in response to a model event', ()=>{
    doc.addTable(new Table());

    const cells = documentController.tableContainer.getElementsByTagName('td');
    expect(cells.length).toBe(1);

    const inputs = documentController.tableContainer.getElementsByTagName('input');
    expect(inputs.length).toBe(1);
    expect(inputs[0].value).toBe('');
  });

  it('should create a table when the user double-clicks in the document', ()=>{
    documentController.tableContainer.dispatchEvent(new MouseEvent('dblclick', {
      target: documentController.tableContainer,
      offsetX: 2 * EM_SIZE,
      offsetY: 3 * EM_SIZE,
    }));

    const tables = Array.from(doc.tables);
    expect(tables.length).toBe(1);
    expect(tables[0].position).toEqual([2, 3]);
    expect(tables[0].width).toBe(1);
    expect(tables[0].height).toBe(1);
    expect(tables[0].cellAt(0,0).value).toEqual('');
  });

  it('should create a column when a user tabs past the end', function() {
    //topLeftInput.dispatchEvent(new KeyboardEvent('keyDown', TAB_KEY_EVENT_INIT));

  });
});
