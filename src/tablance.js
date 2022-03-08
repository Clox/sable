class Tablance {
	#container;//container-element for table
	#containerHeight=0;//height of #container. Used to keep track of if height shrinks or grows
	#containerWidth=0;//height of #container. Used to keep track of if width shrinks or grows
	#colStructs=[];//column-objects. See constructor for structure
	#cols=[];//array of col-elements for each column
	#headerTr;//the tr for the top header-row
	#headerTable;//the tabe for the #headerTr. Tjis table only contains that one row.
	#data=[];//all the data that has been added and is viewable. This is different from what has been added to the DOM
	#scrollRowIndex=0;//the index in the #data of the top row in the view
	#scrollBody;
	#mainTable;
	#tableSizer;//reference to a div wrapping #mainTable. The purpose of it is to set its height to the "true" height
				//of the table so that the scrollbar reflects all the data that can be scrolled through
	#mainTbody;
	#borderSpacingY;//the border-spacing of #mainTable. This needs to be summed with offsetHeight of tr (#rowHeight) to 
					//get real distance between the top of adjacent rows
	#rowHeight;//the height of (non expanded) rows with #borderSpacingY included
	#staticRowHeight;//This is set in the constructor. If it is true then all rows should be of same height which
					 //improves performance.

	/**
	 * 
	 * @param {HTMLElement} container An element which the table is going to be added to
	 * @param {{}[]} columns An array of objects where each object has the following structure: {
	 * 			id String A unique identifier for the column
	 * 			title String The header-string of the column
	 * 			width String The width of the column. This can be in either px or % units.
	 * 				In case of % it will be calculated on the remaining space after all the fixed widths
	 * 				have been accounted for.
	 * 			staticRowHeight Boolean Set to true if all rows are of same height. With this option on, scrolling
	 * 				quickly through large tables will be more performant.
	 * 		}
	 */
	constructor(container,columns,staticRowHeight=false) {
		this.#container=container;
		this.#staticRowHeight=staticRowHeight;
		const allowedColProps=["id","title","width"];
		for (let col of columns) {
			let processedCol={};
			for (let [colKey,colVal] of Object.entries(col)) {
				if (allowedColProps.includes(colKey))
					processedCol[colKey]=colVal;
			}
			this.#colStructs.push(processedCol);
		}
		this.#createTableHeader();
		this.#createTableBody();
		(new ResizeObserver(e=>this.#updateSizesOfViewportAndCols())).observe(container);
		this.#updateSizesOfViewportAndCols();
	}

	#createTableHeader() {
		this.#headerTable=this.#container.appendChild(document.createElement("table"));
		const thead=this.#headerTable.appendChild(document.createElement("thead"));
		this.#headerTr=thead.insertRow();
		for (let col of this.#colStructs) 
			this.#headerTr.appendChild(document.createElement("th")).innerText=col.title;
	}

	#createTableBody() {
		this.#scrollBody=this.#container.appendChild(document.createElement("div"));
		this.#scrollBody.addEventListener("scroll",e=>this.#onScrollStaticRowHeight());
		this.#tableSizer=this.#scrollBody.appendChild(document.createElement("div"));
		this.#mainTable=this.#tableSizer.appendChild(document.createElement("table"));
		this.#borderSpacingY=parseInt(window.getComputedStyle(this.#mainTable)['border-spacing'].split(" ")[1]);
		this.#mainTbody=this.#mainTable.appendChild(document.createElement("tbody"));
		for (let colStruct of this.#colStructs) {
			let col=document.createElement("col");
			this.#cols.push(col);
			this.#mainTable.appendChild(document.createElement("colgroup")).appendChild(col);
		}
	}

	#updateSizesOfViewportAndCols() {
		if (this.#container.offsetHeight!=this.#containerHeight) {
			this.#scrollBody.style.height=this.#container.offsetHeight-this.#headerTable.offsetHeight+"px";
			if (this.#container.offsetHeight>this.#containerHeight)
				this.#maybeAddTrs();
			else
				this.#maybeRemoveTrs();
			this.#containerHeight=this.#container.offsetHeight;
		}
		if (this.#container.offsetWidth>this.#containerWidth) {
			const percentageWidthRegex=/\d+\%/;
			let containerWidth=this.#container.clientWidth;
			let totalFixedWidth=0;
			let numUndefinedWidths=0;
			for (let col of this.#colStructs)
				if (!col.width)
					numUndefinedWidths++;
				else if (!percentageWidthRegex.test(col))//if fixed width
					totalFixedWidth+=(col.pxWidth=parseInt(col.width));
			let sumFixedAndFlexibleWidth=totalFixedWidth;
			for (let col of this.#colStructs)
				if (col.width&&percentageWidthRegex.test(col))//if flexible width
					sumFixedAndFlexibleWidth+=(col.pxWidth=(containerWidth-totalFixedWidth)*parseFloat(col.width)/100);
			for (let col of this.#colStructs)
				if (!col.width)//if undefined width
					col.pxWidth=(containerWidth-sumFixedAndFlexibleWidth)/numUndefinedWidths;
			for (let colI=0; colI<this.#colStructs.length; colI++) 
				this.#cols[colI].style.width=this.#headerTr.cells[colI].style.width=this.#colStructs[colI].pxWidth+"px";
		}	
	}

	addData(data) {
		const priorlyEmpty=!data.length;
		this.#data.push(...data);//much, much faster than concat
		this.#maybeAddTrs();
		this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height||0)+
						data.length*this.#rowHeight-(priorlyEmpty?this.#borderSpacingY:0)+"px";
	}

	#onScrollStaticRowHeight() {
		const scrY=this.#scrollBody.scrollTop;
		//let rowScrollingDone=false;//whether the user has scrolled enough for rows to move and table to adjust
		const newScrollRowIndex=parseInt(scrY/this.#rowHeight);
		if (newScrollRowIndex==this.#scrollRowIndex)
			return;
		if(Math.abs(newScrollRowIndex-this.#scrollRowIndex)>this.#mainTbody.rows.length){//if scrolling by whole page(s)
			this.#mainTbody.replaceChildren();
			this.#scrollRowIndex=parseInt(scrY/this.#rowHeight);
			this.#maybeAddTrs();
		} else {
			const scrollSignum=Math.sign(newScrollRowIndex-this.#scrollRowIndex);//1 if moving down, -1 if up
			for (;this.#scrollRowIndex!=newScrollRowIndex;this.#scrollRowIndex+=scrollSignum) {
				if (scrollSignum==1)//moving up
					this.#updateRowValues(this.#mainTbody.appendChild(this.#mainTbody.firstChild));
				else {//moving down
					let trToMove=this.#mainTbody.lastChild;
					this.#mainTbody.prepend(trToMove);
					this.#updateRowValues(trToMove);
				}
			}
		}
		this.#tableSizer.style.top=this.#scrollRowIndex*this.#rowHeight+"px";
		this.#tableSizer.style.height=(this.#data.length-this.#scrollRowIndex)*this.#rowHeight+"px";
	}

	/**Should be called if tr-elements might need to be created which is when data is added or if table grows*/
	#maybeAddTrs() {
		let lastTr=this.#mainTbody.lastChild;
		const scrH=this.#scrollBody.offsetHeight;
		const dataLen=this.#data.length;
		const trs=this.#mainTable.rows;
		//if there are fewer trs than datarows, and if there is space left below bottom tr
		while (this.#scrollRowIndex+trs.length<dataLen&&(!lastTr||lastTr.offsetTop+this.#rowHeight/2<=scrH)) {
			lastTr=this.#mainTable.insertRow();
			for (let i=0; i<this.#colStructs.length; i++)
				lastTr.insertCell();
			this.#updateRowValues(lastTr);
			if (!this.#rowHeight)//if there were no rows prior to this
				this.#rowHeight=lastTr.offsetHeight+this.#borderSpacingY;
		}
	}

	/**Should be called if tr-elements might need to be removed which is when table shrinks*/
	#maybeRemoveTrs() {
		const scrH=this.#scrollBody.offsetHeight;
		const trs=this.#mainTbody.rows;
		while (trs.length>3&&trs[trs.length-2].offsetTop>scrH)
			this.#mainTbody.lastChild.remove();
	}

	/**Update the values of a row in the table. The tr needs to be passed in and the function will figure out the
	 * corresponding data-item from #data and read from that. The row needs to already have the right amount of td's.
	 * @param {HTMLTableRowElement} tr The tr-element whose cells that should be updated*/
	#updateRowValues(tr) {
		const dataRow=this.#data[tr.rowIndex+this.#scrollRowIndex];
		for (let colI=0; colI<this.#colStructs.length; colI++) {
			let td=tr.cells[colI];
			this.#updateCellValue(td,dataRow);
		}
	}

	#updateCellValue(td,dataRow) {
		let col=this.#colStructs[td.cellIndex];
		td.innerHtml="";
		td.innerText=dataRow[col.id];
	}
}