class Tablance {
	#container;//container-element for table
	#containerHeight=0;//height of #container. Used to keep track of if height shrinks or grows
	#containerWidth=0;//height of #container. Used to keep track of if width shrinks or grows
	#colStructs=[];//column-objects. See columns-param in constructor for structure.
		//In addition to that structure these may also contain "sortDiv" reffering to the div with the sorting-html
																				//(see for example opts->sortAscHtml)
	#cols=[];//array of col-elements for each column
	#headerTr;//the tr for the top header-row
	#headerTable;//the tabe for the #headerTr. This table only contains that one row.
	_allData=[];//contains all, unfiltered data that has been added via addData()
	#data=[];//with no filter applied(empty seachbar) then this is reference to _allData, otherwise is a subset of it
	#scrollRowIndex=0;//the index in the #data of the top row in the view
	#scrollBody;//resides directly inside #container and is the element with the scrollbar. It contains #scrollingDiv
	#scrollingContent;//a div that is inside #scrollbody and holds #tablesizer and #cellCursor if spreadsheet
					//this is needed because putting #cellCursor directly inside #scrollBody will not make it scroll
					//because it has position absolute and needs that. And putting it inside #tableSizer will cause it
					//to jump up and down when pos and height of #tableSizer is adjusted to keep correct scroll-height
	#scrollMarginPx=150;//is used to allow for more rows to be rendered outside of the view so to speak. At least in
						//firefox when scrolling it is really noticable that the scrolling is done before the rows are
						//moved which reveals white area before the rows are rendered. Increasing this number will
						//basically add that many pixels to the height of the viewport on top and bottom. It will not
						//actually be higher but the scroll-method will see it as if it is higher than it is
	#tableSizer;//a div inside #scrollingDiv which wraps #mainTable. The purpose of it is to set its height to the 
				//"true" height of the table so that the scrollbar reflects all the data that can be scrolled through
	#mainTable;//the actual main-table that contains the actual data. Resides inside #tableSizer
	#mainTbody;//tbody of #mainTable
	#multiRowArea;//a div displayed under #scrollBody if rows are selected/checked using select-column. This 
						//section is used to edit multiple rows at once
	#multiRowAreaHeight="95px";//the height of #multiRowArea when fully open
	#multiRowAreaOpen=false;//whether the section is currently open or not
	#multiCellSelected=false;//whether or not a cell inside #multiRowArea is currently selected
	#multiCellIds;//array of ids of columns that are editable and therefore can be edited via multi-cell-section
	#multiCells;//the multi-edit-cells in multiRowArea, in the same order as in #multiCellIds. 
	#multiCellsDataObj;//used to store values of the multi-cells so the inputs can get set correctly initially on edit
	#numberOfRowsSelectedSpan;//resides in #multiRowArea. Should be set to the number of rows selected
	#borderSpacingY;//the border-spacing of #mainTable. This needs to be summed with offsetHeight of tr (#rowHeight) to 
					//get real distance between the top of adjacent rows
	#rowHeight=0;//the height of (non expanded) rows with #borderSpacingY included. Assume 0 first until first row added
	#rowInnerHeight=0;//this is the height that the div inside main-tds should be set to. It's calculated from 
					//#rowHeight minus top&bottom-padding minus #borderSpacingY of td. This is needed to make sure each
					//row is always of the same height and things don't get messed up because some row is heigher
					//because it has high content.
	#staticRowHeight;//This is set in the constructor. If it is true then all rows should be of same height which
					 //improves performance.
	#spreadsheet;//whether the table is a spreadsheet, which is set in the constructor
	#opts; //reference to the object passed as opts in the constructor
	#sortingCols=[];//contains data on how the table currently is sorted. It is an array of 
										//objects which each contain "index" which is the index of the column and
										//"order" which value should be either "desc" or "asc". The array may contain
										//multiple of these objects for having it sorted on multiple ones.
	#searchInput;//the input-element used for filtering data
	#filter;//the currently applied filter. Same as #searchInput.value but also used for comparing old & new values
	
	#cellCursor;//The element that for spreadsheets shows which cell is selected
	#mainRowIndex;//the index of the row that the cellcursor is at
	#mainColIndex;//the index of the column that the cellcursor is at. It is used for both main-table and #multiRowArea
	#activeStruct;//reference to the struct-object of the selcted cell. For cells in the maintable this would
							//point to an object in #colStructs, otherwise to the struct-object of expansion-cells
	#cellCursorDataObj;//reference to the actual object holding the data that the cell-cursor currently is at.
						//Usually this will simply point to an object in #data but for data that is nested with
						//repeat-entries this will point to the correct inner object
	#selectedCellVal;//the value of the cell that the cellCursor is at
	#selectedCell;//the HTML-element of the cell-cursor. probably TD's most of the time.
	#inEditMode;//whether the user is currently in edit-mode
	#cellCursorBorderWidths={};//This object holds the border-widths of the cell-cursor. keys are left,right,top,bottom
	//and values are px as ints. This is used to offset the position and adjust position of #cellCursor in order to
	//center it around the cell. It is also used in conjunction with cellCursorOutlineWidth to adjust margins of the
	//main-table in order to reveal the outermost line when an outermost cell is selected
	#cellCursorOutlineWidth;//px-width as int, used in conjunction with #cellCursorBorderWidths to adjust margins of the
	//main-table in order to reveal the outermost line when an outermost cell is selected
	#inputVal;//the current val of the input when in edit-mode. Will be read and commited if cell is exited correctly
	#highlightOnFocus=true;//when the spreadsheet is focused  we want focus-outline to appear but only if focused by
				//keyboard-tabbing, and not when clicking or exiting out of edit-mode which again focuses the table.
				//By setting this to true in mouseDownEvent we can 
				//check which input was used last when the focus-method is triggerd
	#expansion;//the expansion-argument passed to the constructor
	#expBordersHeight;//when animating expansions for expanding/contracting the height of them fully
			//expanded needs to be known to know where to animate to and from. This is different from 
			//#expandedRowIndicesHeights because that is the height of the whole row and not the div inside.
			//we could retrieve offsetheight of the div each time a row needs to be animated or instead we can get
			//the border-top-width + border-bottom-width once and then substract that from the value of  what's in
			//#expandedRowIndicesHeights instead
	#scrollMethod;//this will be set to a reference of the scroll-method that will be used. This depends on settings for
				//staticRowHeight and expansion
	#rowsMeta={keys:[],vals:[]};//This holds meta-data for the data-rows. The structure is essentially like a hashmap
			//from Java where objects are used as keys which in this case it is the data-row-object. This is done by
			//having 2 arrays: keys & vals. A references to a row is placed in "keys" and meta-data placed in "vals"
			//and index X in "keys" always corresponds to index X in "values". As for the meta-data itself this is
			//another object:
			//	h Integer 	If this is present then the row is expanded, otherwise not. The value is the combined height
			//				of the main row and its expansion-row.
	#filesMeta={keys:[],vals:[]};//Similiar to rowsMeta as it is structured the same but used for files that the user
								//has uploaded during the current session. This is to keep track of upload-progress.
								//keys are filled with File-objects while vals is filled with objects containing
								//metadata: uploadedBytes
	#selectedRows=[];//array of the actual data-objects of rows that are currently selected/checked using the select-col
	#scrollY=0;//this keeps track of the "old" scrollTop of the table when a scroll occurs to know 
	#numRenderedRows=0;//number of tr-elements in the table excluding tr's that are expansions (expansions too are tr's)
	#openExpansions={};//for any row that is expanded and also in view this will hold navigational data which
							//is read from when clicking or navigating using keyboard to know which cell is next, and
							//which elements even are selectable and so on. Keys are data-row-index. As soon as a row
							//is either contracted or scrolled out of view it is removed from here and then re-added
							//if expanded again or scrolled into view.
							//keys are rowDataindex and the values are "cell-objects" structured as: {
							//	el: HTMLElement the cell-element itself
							//	children: Array May be null but groups can have children which would be put in here
							//  				each element would be another one of these cell-objects
							//	parent: points to the parent cell-object. for non nested cells this would point to a
							//						root cell-object. and for the root cell-object this would be null.
							//						despite the root being a cell-object it cant be naviagted to. 
							//						it simply holds the top cell-objects
							//  index: the index of the cell/object in the children-array of its parent
							//}
	#activeExpCell;	//points to an object in #openExpansionNavMap and in extension the cell of an expansion.
							//If this is set then it means the cursor is inside an expansion.
	/* #generatingExpansion=false;//this is a flag that gets set to true when a row gets expanded or an already expanded
		//row gets scrolled into view, in short whenver the expansion-elements are generated. Then it gets unset when
		//creation finishes. The reason for having this flag is so that update */
	#ignoreClicksUntil;//when being inside an open group and trying to double-click on another cell further down to
		//interact with it the first click will highlight it but then the current group closes and what's below it will
		//get shifted up and the second click hits something else. By setting this var to current time plus 500 ms
		//when a group closes and checking if current time is past this one in mouseDown handler we'll ignore the second
		//click which is better user-experience
	#highlightRowsOnView={};//Rows can be added to this object with rowindex in #data as key, value needs to be truthy.
		//Rows that are outside of view can be added and when scrolled into view they will be highlighted. 
	#lastCheckedIndex;//This is the index of the row that was last (un)checked/selected, meaning the checkbox in the
					//select-column was interacted with. This is used if the user interacts with another checkbox while
					//shift is being held
	#numRowsSelected=0;//number of rows that are selected/checked using the select-column
	#numRowsInViewSelected=0;//number of rows in the current view/filter that are selected/checked using select-column
	#animations={};//keeps tracks of animations. Key is a unique id-string, identifying the animation so multiple
					//instances of the same animation can't run. Value is the end-time in ms since epoch.
							

	/**
	 * @param {HTMLElement} container An element which the table is going to be added to
	 * @param {{}[]} columns An array of objects where each object has the following structure: {
	 * 			id String A unique identifier for the column. Unless "render" is set a prop of this name from the
	 * 						data-rows will be used as value for the cells
	 * 			title String The header-string of the column
	 * 			width String The width of the column. This can be in either px or % units.
	 * 				In case of % it will be calculated on the remaining space after all the fixed widths
	 * 				have been accounted for.
	 * 			input: See param expansion -> input. This is the same as that one expect textareas are only valid for
	 * 												expansion-cells and not directly in a maintable-cell
	 * 			render Function pass in a callback-function here and what it returns will be used as value for the
	 * 					cells. It will get called with a reference to the data-row as its first argument, column-object
	 * 					as second, data-row-index as third and column-index and fourth.
	 * 			type String The default is "data". Possible values are:
	 * 				"data" - As it it implies, simply to display data but also input-elements such as fields or buttons
	 * 				"expand" - The column will be buttons used for expanding/contracting the rows. See param expansion
	 * 				"select" - The column will be checkboxes used to (un)select rows	
	 * 		}
	 * 			
	 * 	@param	{Boolean} staticRowHeight Set to true if all rows are of same height. With this option on, scrolling
	 * 				quickly through large tables will be more performant.
	 * 	@param	{Boolean} spreadsheet If true then the table will work like a spreadsheet. Cells can be selected and the
	 * 				keyboard can be used for navigating the cell-selection.
	 * 	@param	{Object} expansion This allows for having rows that can be expanded to show more data. An "entry"-object
	 * 			is expected and some of them can hold other entry-objects so that they can be nested.
	 * 			Types of entries:
	 * 			{//this is an entry that holds multiple rows laid out vertically, each item in the list can have a 
	 * 			 //title on the left side by specifying "title" in each item within the list
  	 *				type:"list",
	 *				title:"Foobar",//displayed title if placed in a container which displays the title
	 * 				entries:[]//each element should be another entry
	 * 				titlesColWidth:String Width of the column with the titles. Don't forget adding the unit.
	 * 					Default is null which enables setting the width via css.
	 * 				onBlur: Function Callback fired when cellcursor goes from being inside the container to outside
	 * 					It will get passed arguments 1:cellObject, 2:mainIndex
	 *			}
	 *			{	
	 *				type: "collection" //basically like a list but each item is inlined, meaning they will be lined up
	 *									//in a horizontal line and will also wrap to multiple lines if needed
	 *				title:"Foobar",//displayed title if placed in a container which displays the title
	 * 				entries:[]//each element should be another entry
	 * 				class:String Css-classes to be added to the collection-div
	 * 				onBlur: Function Callback fired when cellcursor goes from being inside the container to outside
	 * 					It will get passed arguments 1:cellObject, 2:mainIndex
	 *	 		}
	 *			{
  	 * 				type:"field",//this is what will display data and which also can be editable
  	 * 				title:"Foobar",//displayed title if placed in list
  	 * 				id:"foobar",//the key of the property in the data that the row should display
	 * 				maxHeight int For textareas, sets the max-height in pixels that it should be able to be resized to
	 * 				class:String Css-classes to be added to the field
	 * 				input: Object {//field is editable if this object is supplied and its disabled-prop is falsey
	 * 					multiCellWidth Int For inputs that are present in the section that appears when
	 * 						selecting/checking multiple rows using the select-col, this property can be used to specify
	 * 						the number of pixels in width of the cell in that section.
	 * 					onChange: Function Callback fired when the user has changed.
	 * 						It will get passed arguments: 1:newValue,2:oldValue,3:rowData,4:struct,5:cellObject
	 * 					onBlur: Function Callback fired when cellcursor goes from being inside the container to outside
	 * 							It will get passed arguments 1:cellObject, 2:mainIndex
	 * 					enabled Function - If present then this function will be run and if it returns falsey then the
	 * 										cell will not be editable. It may also return an object structured as:
	 * 										{enabled:Bool, message:String}. The message will be displayed to the user 
	 * 											if edit is attempted and enabled is set to false, disabling the field
	 * 							It gets passed the following arguments - 
	 * 													1:struct,2:rowData,3:mainIndex,4:cellObject(if in expansion)
	 * 					type String This is mandatory and specifies the type of input. Possible values are:
	 * 							"text"(single line text),
	 * 							"textarea"(multi-line text),
	 * 							"number"(number with stepper),
	 * 							"date"(a date and possibly time with a calendar),
	 * 							"select"(selection from a list of items).
	 * 							"button"(simple button)
	 * 							"file"(file-upload) The data for a file entry may be a File-object which it will be if
	 * 									the file has been uploaded during the current session. Or it may be an object
	 * 									which basically have the same properties as File:lastModified, name, size, type
	 * 									altough none of those properties are mandatory. Use property "fileUploadHandler"
	 * 									to handle the actual upload.
	 * 						Depending on which one is selected certain properties
	 * 							below are (dis)allowed.
	 * 					---Properties used exclusively by input "file"---
	 * 						fileUploadHandler Function This callback will be triggered when the user does a file-upload.
	 * 							Arguments: 1:XMLHttpRequest - call open() on this to specify url and such,
	 * 							2: The File-object, 3:struct,4:rowData,5:mainIndex,6:cellObject(if in expansion)
	 * 						fileMetasToShow Object An object specifying which meta-bits to show. Default of all are true
	 * 							{filename Bool, lastModified Bool, size Bool, type Bool}
	 * 							May also be set via opts->defaultFileMetasToShow
	 * 						openHandler Function callback-function for when the open-button is pressed. It gets the
	 * 							following arguments passed to it: 
	 * 							1: Event, 2: File-object, 3:struct,4:rowData,5:mainIndex,6:cellObject(if in expansion)
	 * 						deleteHandler Function callback-function for when the user deletes a file. It gets the 
	 * 							following arguments passed to it:
	 * 							1: Event, 2: File-object, 3:struct,4:rowData,5:mainIndex,6:cellObject(if in expansion)
	 * 					-------------------------------------------------
	 * 					maxLength int Sets max-length for strings if type is "text"
	 * 					placeholder String adds a placeholder-string to the input-element
	 * 					options: Array //may be supplied if type is "select". Each element should be an object: {
	 * 						value:the value of the cell will be mapped to the option with the same value
	 * 						text:unless a render-method has been specified then this is what will be shown to the user
	 * 					}
  	 * 					btnText: String,//If type is "button" then this will be the text on it
	 * 					clickHandler:Function //Used for type "button". A callback-function that will get called 
	 * 							//when the button is pressed. It will get passed arguments 1:event, 2:dataObject
	 * 							//,3:mainDataIndex,4:struct,5:cellObject(if inside expansion)
	 * 					noResultsText String For type "select", a string which is displayed when a user filters the 
	 * 						options in a select and there are no results. 
	 * 						Can also be set globally via param opts->lang
	 * 					minOptsFilter Integer - The minimum number of options required for the filter-input to appear
	 * 						Can also be set via param opts->defaultMinOptsFilter
	 * 					allowSelectEmpty bool - Used for type "select". Default true.Pins an empty-option at the top
	 * 					allowCreateNew bool - Used for type "select". Allows user to create new options.
	 * 								If this is true then minOptsFilter will be ignored, input-field is required anyway.
	 * 					createNewOptionHandler Function - Used for type "select". Callback which is called when
	 * 						the user creates a new option, which can be done if allowCreateNew is true. It will get 
	 * 							passed arguments 1:new option-object,2:event, 3:dataObject
	 * 							//,4:mainDataIndex,5:struct,6:cellObject(if inside expansion)
	 * 					selectInputPlaceholder String - Used for type "select". A placeholder for the input which
	 * 						is visible either if the number of options exceed minOptsFilter or allowCreateNew is true
	 * 					emptyOptString String - For type "select", specifies the text of the empty option if 
	 * 						allowSelectEmpty is true. Can also be set via param opts->lang
  	 * 			}}
	 * 			{
  	 * 				type:"repeated",//used when the number of rows is undefined and where more may be able to be added, 
	 * 								//perhaps by the user. Having a list with a repeated->field basically works the same
	 * 								//as having a list with multiple fields. A list can also mix repeated/dynamic and
	 * 								//static fields. The structure could look something like:
	 * 								//list
	 * 								//	repeated
	 * 								//		field
	 * 								//	field1
	 * 								//	field2
  	 * 				id:"foobar",//this should be the key of an array in the data where each object corresponds to each
	 * 							//element in this repeated rows.
  	 * 				entry: any entry //may be item or list for instance. the data retrieved for these will be 1
	 * 								//level deeper so the path from the base would be idOfRepeatedRows->arrayIndex->*
	 * 				create: Bool //if true then a row is added which can be interacted with to insert more entries
	 * 				onCreate: Function Callback fired when the user has committed a new row. It is counted as committed
	 * 					when the cell-cursor has left the repeat-row after having created it.
	 * 					It will get passed arguments: 1:rowData,2:cellObject
	 * 				sortCompare: Function Passing in a function allows for sorting the entries. As expected this
	 * 						function will get called multiple times to compare the entries to one another.
	 * 						It gets 4 arguments: 1: object A, 2: object B, 3: rowData, 4: cellObject
	 * 						Return >0 to sort A after B, <0 to sort B after A, or ===0 to keep original order of A and B
	 * 				creationText: //used if "create" is true. the text of the creation-cell. default is "Create new"
	 * 				deleteText: //used if "create" is true. the text of the deletion-button. default is "Delete"
	 * 							//can also be set via param opts->lang
	 * 				deleteAreYouSureText: //used if "create" is true. text above yes/no-btns. default is "Are you sure?"
	 * 							//can also be set via param opts->lang
	 * 				areYouSureYesText: //used if "create" is true. text of confirm-button for delete. Default is "Yes"
	 * 							//can also be set via param opts->lang
	 * 				areYouSureNoText: //used if "create" is true. text of cancel-button for delete. Default is "No"
	 * 							//can also be set via param opts->lang
  	 * 			}
  	 * 			{
  	 * 				type:"group",//used when a set of data should be grouped, like for instance having an address and
	 * 							//all the rows in it belongs together. the group also has to be entered
	 * 							//with enter/doubleclick
  	 * 				title:"Foobar",//displayed title if placed in list
  	 * 				entries: Array any entries. fields, lists, etc.. 
	 * 				closedRender: Function //pass a method here that will get the data for the group as first arg.
	 * 								//it needs to return a string which will replace the group-content when it is closed
  	 * 			}
	 * 	@param	{Object} opts An object where different options may be set. The following options/keys are valid:
	 * 							searchbar Bool that defaults to true. If true then there will be a searchbar that
	 * 								can be used to filter the data.
	 * 							sortAscHtml String - html to be added to the end of the th-element when the column
	 * 													is sorted in ascending order
	 * 							sortDescHtml String - html to be added to the end of the th-element when the column
	 * 													is sorted in descending order
	 * 							sortNoneHtml String - html to be added to the end of the th-element when the column
	 * 													is not sorted
	 * 							defaultMinOptsFilter Integer The minimum number of options required for the
	 * 								filter-input of input-type "select" to appear
	 * 							defaultFileMetasToShow Object Default meta-data for files to show.
	 * 													See prop fileMetasToShow in param expansion
	 * 							lang Object {  Object to replace language-specific text. The strings may be html-code
	 * 										except for ones used as placeholders. Below are the keys and defaults.
	 * 								fileName "Filename"
	 * 								fileLastModified "Last Modified"
	 * 								fileSize "Size"
	 * 								fileType "Type"
	 * 								fileUploadDone "Done!"
	 * 								fileChooseOrDrag "<b>Press tp choose a file</b> or drag it here"
	 * 								fileDropToUpload "<b>Drop to upload</b>"
	 *								filterPlaceholder "Search"
	 * 								delete "Delete" (used in the deletion of repeat-items or files)
	 * 								deleteAreYouSure "Are you sure?" (Used in the deletion of repeat-items or files)
	 * 								deleteAreYouSureYes "Yes"  (Used in the deletion of repeat-items or files)
	 * 								deleteAreYouSureNo	"No" (Used in the deletion of repeat-items)
	 * 								selectEmptyOpt "Empty" Text of the empty/null-option for type "select"
	 * 								datePlaceholder "YYYY-MM-DD"
	 * 								selectNoResultsFound "No results found"
	 * 							}
	 * */
	constructor(container,columns,staticRowHeight=false,spreadsheet=false,expansion=null,opts=null) {
		this.#container=container;
		this.#spreadsheet=spreadsheet;
		this.#expansion=expansion;
		container.classList.add("tablance");
		this.#staticRowHeight=staticRowHeight;
		this.#opts=opts;
		const allowedColProps=["id","title","width","input","type","render"];
		for (let col of columns) {
			let processedCol={};
			if ((col.type=="expand"||col.type=="select")&&!col.width)
				processedCol.width=50;
			for (let [colKey,colVal] of Object.entries(col)) {
				if (allowedColProps.includes(colKey))
					processedCol[colKey]=colVal;
			}
			this.#colStructs.push(processedCol);
		}
		if (opts?.searchbar!=false)
			this.#setupSearchbar();
		this.#createTableHeader();
		this.#createTableBody();
		(new ResizeObserver(this.#updateSizesOfViewportAndCols.bind(this))).observe(container);
		
		if (spreadsheet)
			this.#setupSpreadsheet();
		this.#updateSizesOfViewportAndCols();
		if (opts.sortAscHtml==null)
			opts.sortAscHtml='<svg viewBox="0 0 8 10" style="height:1em"><polygon style="fill:#ccc" '
									+'points="4,0,8,4,0,4"/><polygon style="fill:#000" points="4,10,0,6,8,6"/></svg>';
		if (opts.sortDescHtml==null)
			opts.sortDescHtml='<svg viewBox="0 0 8 10" style="height:1em"><polygon style="fill:#000" '
									+'points="4,0,8,4,0,4"/><polygon style="fill:#ccc" points="4,10,0,6,8,6"/></svg>';
		if (opts.sortNoneHtml==null)
			opts.sortNoneHtml='<svg viewBox="0 0 8 10" style="height:1em"><polygon style="fill:#ccc" '
									+'points="4,0,8,4,0,4"/><polygon style="fill:#ccc" points="4,10,0,6,8,6"/></svg>';
		this.#updateHeaderSortHtml();
	}

	#setupSearchbar() {
		this.#searchInput=this.#container.appendChild(document.createElement("input"));
		this.#searchInput.type=this.#searchInput.className="search";
		this.#searchInput.placeholder=this.#opts.lang?.filterPlaceholder??"Search";
		const clearSearchCross=document.createElement("button");
		this.#searchInput.addEventListener("input",e=>this.#onSearchInput(e));
	}

	#onSearchInput(e) {
		this.#filterData(this.#searchInput.value);
	}

	#setupSpreadsheet() {
		this.#container.classList.add("spreadsheet");
		this.#cellCursor=document.createElement("div");
		this.#cellCursor.className="cell-cursor";
		this.#cellCursor.style.display="none";
		this.#createMultiRowArea();
		//remove any border-spacing beacuse if the spacing is clicked the target-element will be the table itself and
		//no cell will be selected which is bad user experience. Set it to 0 for headerTable too in order to match
		this.#mainTable.style.borderSpacing=this.#headerTable.style.borderSpacing=this.#borderSpacingY=0;
		
		const cellCursorComputedStyle=window.getComputedStyle(this.#cellCursor);
		for (let dir of ['top','right','bottom','left'])
			this.#cellCursorBorderWidths[dir]=parseInt(cellCursorComputedStyle[`border-${dir}-width`]);
		this.#cellCursorOutlineWidth=parseInt(cellCursorComputedStyle.outlineWidth);
		this.#scrollingContent.style.marginTop=this.#cellCursorBorderWidths.top+this.#cellCursorOutlineWidth+"px";
		this.#scrollingContent.style.marginLeft=this.#cellCursorBorderWidths.left+this.#cellCursorOutlineWidth+"px";
		this.#tableSizer.style.paddingBottom
				=this.#cellCursorBorderWidths.bottom+this.#cellCursorBorderWidths.top+this.#cellCursorOutlineWidth+"px";
		this.#tableSizer.style.paddingRight=this.#cellCursorOutlineWidth+"px";

		this.#container.tabIndex=0;//so that the table can be tabbed to
		this.#container.addEventListener("keydown",e=>this.#spreadsheetKeyDown(e));
		this.#container.addEventListener("mousedown",e=>this.#spreadsheetMouseDown(e));
		this.#container.addEventListener("focus",e=>this.#spreadsheetOnFocus(e));
		this.#container.addEventListener("blur",e=>this.#spreadsheetOnBlur(e));
		this.#mainTable.addEventListener("mousedown",e=>this.#mainTableMouseDown(e));
		this.#cellCursor.addEventListener("dblclick",e=>this.#enterCell(e));
	}

	#rowMetaGet(dataIndex) {
		return this.#rowsMeta.vals[this.#rowsMeta.keys.indexOf(this.#data[dataIndex])];
	}

	#rowMetaSet(dataIndex,key,val) {
		const linkIndex=this.#rowsMeta.keys.indexOf(this.#data[dataIndex]);
		if (linkIndex==-1&&val!=null) {
			this.#rowsMeta.vals.push({[key]:val});
			this.#rowsMeta.keys.push(this.#data[dataIndex]);
		} else if (linkIndex!=-1&&val==null) {
			delete this.#rowsMeta.vals[linkIndex][key];
			if (!Object.keys(this.#rowsMeta.vals[linkIndex]).length) {
				this.#rowsMeta.vals.splice(linkIndex,1);
				this.#rowsMeta.keys.splice(linkIndex,1);
			}
		} else if (linkIndex!=-1&&val!=null)
			this.#rowsMeta.vals[linkIndex][key]=val;	
		return val;
	}

	#spreadsheetOnFocus(e) {
		if (!this.#mainColIndex&&this.#data.length)
			this.#selectMainTableCell(this.#mainTbody.rows[0].cells[0]);
		//when the table is tabbed to, whatever focus-outline that the css has set for it should show, but then when the
		//user starts to navigate using the keyboard we want to hide it because it is a bit distracting when both it and
		//a cell is highlighted. Thats why #spreadsheetKeyDown sets outline to none, and this line undos that
		//also, we dont want it to show when focusing by mouse so we use #focusMethod (see its declaration)
		if (this.#highlightOnFocus)
			this.#container.style.removeProperty("outline");
		else
			this.#container.style.outline="none"
	}

	#spreadsheetOnBlur(e) {
		setTimeout(()=>this.#highlightOnFocus=!this.#container.contains(document.activeElement));
	}

	#moveCellCursor(hSign,vSign) {
		//const newColIndex=Math.min(this.#cols.length-1,Math.max(0,this.#cellCursorColIndex+numCols));
		this.#scrollToCursor();

		if (this.#multiCellSelected) {
			this.#selectMultiCell(hSign?this.#selectedCell.parentNode[(hSign>0?"next":"previous")+"Sibling"]
																		?.querySelector(".cell"):this.#selectedCell);
		} else if (this.#activeExpCell?.parent?.struct.type==="collection")
			this.#moveInsideCollection(hSign,vSign);
		else if (vSign) {//moving up or down
			let newColIndex=this.#mainColIndex;
			if (this.#activeExpCell) {//moving from inside expansion.might move to another cell inside,or outside
					this.#selectAdjacentExpansionCell(this.#activeExpCell,vSign==1);
			} else if (vSign===1&&this.#rowMetaGet(this.#mainRowIndex)?.h){//moving down into expansion
				this.#selectFirstSelectableExpansionCell(this.#openExpansions[this.#mainRowIndex],true);
			} else if (vSign===-1&&this.#rowMetaGet(this.#mainRowIndex-1)?.h){//moving up into expansion
				this.#selectFirstSelectableExpansionCell(this.#openExpansions[this.#mainRowIndex-1],false);
			} else {//moving from and to maintable-cells
				this.#selectMainTableCell(
					this.#selectedCell.parentElement[(vSign>0?"next":"previous")+"Sibling"]?.cells[newColIndex]);
			}
			//need to call this a second time. first time is to scroll to old td to make sure the new td is rendered
			this.#scrollToCursor();//this time it is to actually scroll to the new td
		} else if (!this.#activeExpCell){
			this.#selectMainTableCell(this.#selectedCell[(hSign>0?"next":"previous")+"Sibling"]);
		}
	}

	#moveInsideCollection(numCols,numRows) {
		const currentCellX=this.#activeExpCell.el.offsetLeft;
		const currentCellTop=this.#activeExpCell.el.offsetTop;
		const currentCellBottom=this.#activeExpCell.el.offsetTop+this.#activeExpCell.el.offsetHeight;
		if (numCols) {//moving left or right
			for (let i=this.#activeExpCell.index,nextCell;nextCell=this.#activeExpCell.parent.children[i+=numCols];) {
				if (nextCell.el.offsetParent != null)
					if ((nextCell?.el.offsetLeft>currentCellX)==(numCols>0)) {
						this.#selectExpansionCell(nextCell);
						break;
					}
			}
		} else {//moving up or down
			let closestCell,closestCellX;
			const siblings=this.#activeExpCell.parent.children;
			for (let i=this.#activeExpCell.index,otherCell;otherCell=siblings[i+=numRows];) {
				const skipCell=Math.max(otherCell.el.offsetTop,currentCellTop) <= 					 //cells are on the
								Math.min(otherCell.el.offsetTop+otherCell.el.offsetHeight,currentCellBottom)//same line
								||otherCell.el.offsetParent == null;//cell is hidden
				if (skipCell)
					continue;
				else if (closestCell&&(otherCell.el.offsetLeft<closestCellX)===(numRows>0))//scrolled past whole row
					break;
				if (!closestCell||Math.abs(otherCell.el.offsetLeft-currentCellX)<Math.abs(closestCellX-currentCellX)) {
					closestCell=otherCell;
					closestCellX=closestCell.el.offsetLeft;
				} else//if further away than current closest one.
					break;
			}
			if (closestCell)
				this.#selectExpansionCell(closestCell);
			else
				this.#selectAdjacentExpansionCell(this.#activeExpCell.parent,numRows==1?true:false);
		}
	}

	#selectAdjacentExpansionCell(cellObj,isGoingDown) {
		let cell=this.#getAdjacentExpansionCell(cellObj,isGoingDown);
		if (cell)
			return this.#selectExpansionCell(cell);
		this.#selectMainTableCell(this.#mainTbody.querySelector
				(`[data-data-row-index="${this.#mainRowIndex+isGoingDown}"]`)?.cells[this.#mainColIndex]);
	}
	
	#getAdjacentExpansionCell (cellObj,isGoingDown) {
		const siblings=cellObj.parent.children;
		const index=cellObj.index;
		for (let i=index+(isGoingDown||-1); i>=0&&i<siblings.length; i+=isGoingDown||-1) {
			const sibling=siblings[i];
			if (sibling.el)
				return sibling;
			//else if sibling.children
			const niece=this.#getFirstSelectableExpansionCell(sibling,isGoingDown);
			if (niece)
				return niece;
		}
		if (cellObj.parent.parent)
			return this.#getAdjacentExpansionCell(cellObj.parent,isGoingDown);
	}

	#selectFirstSelectableExpansionCell(cellObj,isGoingDown) {
		const newCellObj=this.#getFirstSelectableExpansionCell(cellObj,isGoingDown);
		if (newCellObj)
			return this.#selectExpansionCell(newCellObj);
		this.#selectMainTableCell(this.#mainTbody.querySelector
				(`[data-data-row-index="${this.#mainRowIndex+(isGoingDown||-1)}"]`)?.cells[this.#mainColIndex]);
	}

	/**Given a cell-object, like the expansion of a row or any of its sub-containers, it will return the first
	 * selectable cell from top or bottom
	 * @param {*} cellObj
	 * @param {Boolean} isGoingDown 
	 * @param {Boolean} onlyGetChild if this is set to true then it will never return the passed in cellObj and instead
	 *			only look at its (grand)children. Used for groups where both itself and its children can be selected*/
	#getFirstSelectableExpansionCell(cellObj,isGoingDown,onlyGetChild=false) {
		if (!onlyGetChild&&cellObj.el)
			return cellObj;
		const children=cellObj.children;
		let startI=isGoingDown?0:children.length-1;
		if (cellObj.struct.type==="collection"&&!isGoingDown) {
			let chosenCell;
			for (let i=startI,otherCell;otherCell=children[i--];) {
				if (!chosenCell||otherCell.el.offsetLeft<chosenCell.el.offsetLeft)
					chosenCell=otherCell;
				else
					break;
			}
			startI=chosenCell.index;
		}
		for (let childI=startI;childI>=0&&childI<children.length; childI+=isGoingDown||-1)
			if (children[childI].struct.type==="list"||(children[childI].el??children[childI].selEl)?.offsetParent)
				 return this.#getFirstSelectableExpansionCell(children[childI],isGoingDown);
	}
	
	#spreadsheetKeyDown(e) {
		if (this.#inEditMode&&this.#activeStruct.input.type==="date") {
			if (e.key.slice(0,5)==="Arrow") {
				if (e.ctrlKey)
					e.stopPropagation();//allow moving textcursor if ctrl is held so prevent date-change then
				else
					e.preventDefault();//prevent textcursor from moving when arrowkey-selecting dates in date-picker
			} else if (e.key==="Backspace")
				e.stopPropagation();
		}
		this.#container.style.outline="none";//see #spreadsheetOnFocus
		if (!this.#inEditMode) {
			switch (e.key) {
				case "ArrowUp":
					this.#moveCellCursor(0,-1);
				break; case "ArrowDown":
					this.#moveCellCursor(0,1);
				break; case "ArrowLeft":
					this.#moveCellCursor(-1,0);
				break; case "ArrowRight":
					this.#moveCellCursor(1,0);
				break; case "Escape":
					this.#groupEscape();
				break; case "+":
					this.#scrollToCursor();
					this.#expandRow(this.#selectedCell.closest(".main-table>tbody>tr"));
				break; case "-":
					this.#scrollToCursor();
					this.#contractRow(this.#selectedCell.closest(".main-table>tbody>tr"));
				break; case "Enter": case " ":
					this.#scrollToCursor();
					if (this.#activeStruct.type=="expand")
						return this.#toggleRowExpanded(this.#selectedCell.parentElement);
					if (this.#activeStruct.type=="select")
						return this.#rowCheckboxChange(this.#selectedCell,e.shiftKey);
					if (e.key==="Enter"||this.#activeStruct.input?.type==="button") {
						e.preventDefault();//prevent newline from being entered into textareas
						return this.#enterCell(e);
					}
			}
		} else {
			switch (e.key) {
				case "Enter":
					this.#moveCellCursor(0,e.shiftKey?-1:1);
				break; case "Escape":
					this.#exitEditMode(false);
			}
		}
	}

	#groupEscape() {
		for (let cellObj=this.#activeExpCell; cellObj=cellObj.parent;)
			if (cellObj.struct.type==="group")
				return this.#selectExpansionCell(cellObj);
	}

	#insertAtCursor(myField, myValue) {
		//IE support
		if (document.selection) {
			myField.focus();
			sel = document.selection.createRange();
			sel.text = myValue;
		}
		//MOZILLA and others
		else if (myField.selectionStart || myField.selectionStart == '0') {
			var startPos = myField.selectionStart;
			var endPos = myField.selectionEnd;
			myField.value = myField.value.substring(0, startPos)
				+ myValue
				+ myField.value.substring(endPos, myField.value.length);
		} else {
			myField.value += myValue;
		}
	}

	#unsortCol(id,type) {
		for (let sortCol,i=-1;sortCol=this.#sortingCols[++i];)
			if (id&&id==sortCol.id||type&&type==sortCol.type) {
				this.#sortingCols.splice(i,1);
				this.#updateHeaderSortHtml();
				return;
			}
	}

	#expandRow(tr,animate=true) {
		const dataRowIndex=parseInt(tr.dataset.dataRowIndex);
		if (!this.#expansion||this.#rowMetaGet(dataRowIndex)?.h>0)
			return;
		const expRow=this.#renderExpansion(tr,dataRowIndex);
		const expHeight=this.#rowMetaSet(dataRowIndex,"h",this.#rowHeight+expRow.offsetHeight+this.#borderSpacingY);
		const contentDiv=expRow.querySelector(".content");
		if (!this.#expBordersHeight)//see declarataion of #expansionTopBottomBorderWidth
			this.#expBordersHeight=expHeight-contentDiv.offsetHeight;
		this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height)//adjust scroll-height reflect change...
			+expHeight-this.#rowHeight+"px";//...in height of the table
		if (animate) {
			this.#unsortCol(null,"expand");
			contentDiv.style.transition="";
			contentDiv.style.height="0px";//start at 0
			setTimeout(()=>contentDiv.style.height=expHeight-this.#expBordersHeight+"px");
			this.#animate(()=>this.#adjustCursorPosSize(this.#selectedCell,true),500,"cellCursor");
		} else {
			contentDiv.style.transition="none";
			contentDiv.style.height=expHeight-this.#expBordersHeight+"px";
		}
		return expHeight;
	}

	#contractRow(tr) {
		if (tr.classList.contains("expansion"))
			tr=tr.previousSibling;
		const dataRowIndex=parseInt(tr.dataset.dataRowIndex);
		if (!this.#expansion||!this.#rowMetaGet(dataRowIndex)?.h)
			return;
		this.#unsortCol(null,"expand");
		if (this.#mainRowIndex==dataRowIndex&&this.#activeExpCell) {//if cell-cursor is inside the expansion
			this.#selectMainTableCell(tr.cells[this.#mainColIndex]);//then move it out
			this.#scrollToCursor();
		}
		const contentDiv=tr.nextSibling.querySelector(".content");
		if (contentDiv.style.height==="auto") {//if fully expanded
			contentDiv.style.height=this.#rowMetaGet(dataRowIndex).h-this.#expBordersHeight+"px";
			setTimeout(()=>contentDiv.style.height=0);
		} else if (parseInt(contentDiv.style.height)==0)//if previous closing-animation has reached 0 but transitionend 
		//hasn't been called yet which happens easily, for instance by selecting expand-button and holding space/enter
			contentDiv.dispatchEvent(new Event('transitionend'));
		else//if in the middle of animation, either expanding or contracting. make it head towards 0
			contentDiv.style.height=0;
		this.#animate(()=>this.#adjustCursorPosSize(this.#selectedCell,true),500,"cellCursor");
	}

	/**Creates the actual content of a expanded row. When the user expands a row #expandRow is first called which in
	 * turn calls this one. When scrolling and already expanded rows are found only this one needs to be called.
	 * @param {*} tr 
	 * @param {*} rowIndex 
	 * @returns */
	#renderExpansion(tr,rowIndex) {
		tr.classList.add("expanded");
		const expansionRow=tr.parentElement.insertRow(tr.rowIndex+1);
		expansionRow.className="expansion";
		expansionRow.dataset.dataRowIndex=rowIndex;
		const expansionCell=expansionRow.insertCell();
		expansionCell.colSpan=this.#cols.length;
		const expansionDiv=expansionCell.appendChild(document.createElement("div"));//single div inside td for animate
		expansionDiv.style.height="auto";
		expansionDiv.className="content";
		expansionDiv.addEventListener("transitionend",this.#expansionAnimationEnd.bind(this));
		const shadowLine=expansionDiv.appendChild(document.createElement("div"));
		shadowLine.className="expansion-shadow";
		const cellObject=this.#openExpansions[rowIndex]={};
		this.#generateExpansionContent(this.#expansion,rowIndex,cellObject,expansionDiv,[],this.#data[rowIndex]);
		cellObject.rowIndex=rowIndex;
		return expansionRow;
	}

	#expansionAnimationEnd(e) {
		if (e.currentTarget!==e.target)
			return;//otherwise it will apply to transitions of child-elements as well
		if (parseInt(e.target.style.height)) {//if expand finished

			e.target.style.height="auto";
		} else {//if contract finished

			const expansionTr=e.target.closest("tr");
			const mainTr=expansionTr.previousSibling;
			const dataRowIndex=mainTr.dataset.dataRowIndex;
			mainTr.classList.remove("expanded");
			this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height)
				 -this.#rowMetaGet(dataRowIndex).h+this.#rowHeight+"px";
			expansionTr.remove();
			this.#rowMetaSet(dataRowIndex,"h",null);
			delete this.#openExpansions[dataRowIndex];
		}
	}

	/**
	 * 
	 * @param {*} struct 
	 * @param {*} data 
	 * @param {*} cellObject 
	 * @param {*} parentEl 
	 * @param []int path Keeps track of the "path" by adding and removing index-numbers from the array when going
	 * 				in and out of nesting. This path is then added as a data-attribute to the cells that can be
	 * 				interacted with and this data is then read from and the cell-object can then be retrieved from it.*/
	#generateExpansionContent(struct,dataIndex,cellObject,parentEl,path,rowData) {
		if (!path.length)
			cellObject.rowIndex=dataIndex;
		cellObject.path=[...path];
		cellObject.dataObj=rowData;
		cellObject.struct=struct;
		const args=[struct,dataIndex,cellObject,parentEl,path,rowData];
		switch (struct.type) {
			case "list": return this.#generateExpansionList(...args);
			case "field": return this.#generateField(...args);
			case "group": return this.#generateExpansionGroup(...args);
			case "repeated": return this.#generateExpansionRepeated(...args);
			case "collection": return this.#generateExpansionCollection(...args);
		}
	}

	/**This is supposed to get called when a repeated-struct is found however in #generateExpansionList,
	 * repeated-structs are looked for and handled by that method instead so that titles can be added to the list
	 * which isn't handled by #generateExpansionContent but by the list-method itself
	 * @param {*} struct 
	 * @param {*} dataIndex 
	 * @param {*} cellObj 
	 * @param {*} parentEl 
	 * @param {*} path 
	 * @param {*} rowData 
	 * @returns */
	#generateExpansionRepeated(struct,dataIndex,cellObj,parentEl,path,rowData) {
		cellObj.children=[];
		let repeatData=cellObj.dataObj=rowData[struct.id];
		if (repeatData?.length) {
			if (struct.create&&struct.entry.type==="group")
				(struct={...struct}).entry=this.#getGroupStructCopyWithDeleteControls(struct.entry);//copy repeat-struct
					//not to edit the original. Then add delete-controls to its inner group which also gets copied.
			if (struct.sortCompare)
				(repeatData=[...repeatData]).sort(struct.sortCompare);
			for (let childI=0; childI<repeatData.length; childI++) {
				let childObj=cellObj.children[childI]={parent:cellObj,index:childI};
				path.push(childI);
				this.#generateExpansionContent(struct.entry,dataIndex,childObj,parentEl,path,repeatData[childI]);
				path.pop();
			}
		}
		if (struct.create) {
			const creationTable=parentEl.appendChild(document.createElement("table"));
			const creationCell=creationTable.insertRow().insertCell();
			creationCell.innerText=struct.creationText??"Insert new";
			creationTable.classList.add("repeat-insertion","empty");//empty for hiding it when group is closed if group
			cellObj.children.push(
								{parent:cellObj,el:creationTable,index:repeatData.length,struct:{type:"repeatCreate"}});
			creationTable.dataset.path=path.join("-")+"-"+repeatData.length;
		}
		
		return !!repeatData?.length||struct.create;
	}

	#beginDeleteRepeated(e,data,mainIndex,struct,cell) {
		if (!cell.parent.parent.creating) {
			cell.parent.containerEl.classList.add("delete-confirming");
			this.#moveInsideCollection(1);//move away from the delete-button which now dissapeared, to the next btn
		} else
			this.#deleteCell(cell.parent.parent);
	}

	#cancelDelete(e,data,mainIndex,struct,cell) {
			cell.parent.containerEl.classList.remove("delete-confirming");
			this.#selectExpansionCell(cell.parent.children[0]);
	}

	#getGroupStructCopyWithDeleteControls(struct) {
		const deleteControls={type:"collection",class:"delete-controls"
			,onBlur:cel=>cel.selEl.querySelector(".collection").classList.remove("delete-confirming")
			,entries:[{type:"field",input:{type:"button",
				btnText:struct.deleteText??this.#opts.lang?.delete??"Delete"
				,clickHandler:this.#beginDeleteRepeated.bind(this)},class:"delete"},
			{type:"field",input:{type:"button"
				,btnText:struct.areYouSureNoText??this.#opts.lang.deleteAreYouSureNo??"No",
				clickHandler:this.#cancelDelete.bind(this)},class:"no"
				,title:struct.deleteAreYouSureText??this.#opts.lang?.deleteAreYouSure??"Are you sure?"},
			{type:"field",input:{type:"button"
				,btnText:struct.areYouSureYesText??this.#opts.lang?.deleteAreYouSureYes??"Yes",
				clickHandler:(e,data,index,strct,cel)=>{
					if (cel.parent.parent.fileInputStruct) {
						const fileCell=cel.parent.parent;
						const inputStruct=fileCell.fileInputStruct;
						const dataRow=fileCell.parent.dataObj;
						delete dataRow[inputStruct.id];
						const fileTd=fileCell.el.parentElement;
						fileTd.innerHTML="";
						fileTd.classList.remove("group-cell");
						this.#generateExpansionContent(inputStruct,index,fileCell,fileTd,fileCell.path,dataRow);
						inputStruct.deleteHandler?.(e,data,inputStruct,fileCell.parent.dataObj,index,fileCell);
						this.#selectExpansionCell(fileCell);
					} else
						this.#deleteCell(cel.parent.parent);
				}},class:"yes"}]};
		struct={...struct};//make shallow copy so original is not affected
		struct.entries=[...struct.entries,deleteControls];
		return struct;
	}

	#generateButton(struct,mainIndex,parentEl,rowData,cellObj=null) {
		const btn=parentEl.appendChild(document.createElement("button"));
		btn.tabIndex="-1";//so it can't be tabbed to
		btn.innerHTML=struct.input.btnText;
		btn.addEventListener("click",e=>struct.input.clickHandler?.(e,rowData,mainIndex,struct,cellObj));

		//prevent gaining focus upon clicking it whhich would cause problems. It should be "focused" by having the
		//cellcursor on its cell which triggers it with enter-key anyway
		btn.addEventListener("mousedown",e=>e.preventDefault());
		return true;
	}

	#generateExpansionGroup(groupStructure,dataIndex,cellObj,parentEl,path,rowData) {
		parentEl.dataset.path=path.join("-");
		cellObj.children=[];
		cellObj.dataObj=rowData;
		const groupTable=document.createElement("table");
		parentEl.classList.add("group-cell");
		cellObj.el=groupTable;//so that the whole group-table can be selectedf
		groupTable.className="expansion-group";
		for (let entryI=-1,struct; struct=groupStructure.entries[++entryI];) {
			let tr=groupTable.insertRow();
			tr.className="empty";//start as empty to hide when closed.updateCell() will remove it if a cell is non-empty
			let td=tr.insertCell();
			td.classList.toggle("disabled",struct.type=="field"&&!struct.input)
			if (entryI>0) {
				const separator=td.appendChild(document.createElement("div"));
				separator.className="separator";
			}
			if (struct.title) {
				let header=td.appendChild(document.createElement("h4"));
				header.innerText=struct.title;
			}
			
			let contentDiv=td.appendChild(document.createElement("div"));
			contentDiv.className="value";
			path.push(entryI);

			//create cell-object for group-member. nonEmptyDescentants keeps track of how many descendant-cells that are
			//non-empty in order to mark group-rows as empty to hide them while group is closed
			//selEl is set and will be what the cell-cursor highlights. We do want to highlight the whole td but still
			//it can't be used as the normal el and therefore get its innerText set when editing it because it also
			//contains a header-element
			let childCellObj=cellObj.children[entryI]
												={nonEmptyDescentants:0,grpTr:tr,parent:cellObj,index:entryI,selEl:td};

			this.#generateExpansionContent(struct,dataIndex,childCellObj,contentDiv,path,rowData);
			path.pop();
		}
		if (groupStructure.closedRender) {
			groupTable.classList.add("closed-render");
			const renderRow=groupTable.insertRow();
			renderRow.dataset.path=path.join("-");
			renderRow.className="group-render";
			const renderCell=renderRow.insertCell();
			renderCell.innerText=groupStructure.closedRender(rowData);
		}
		parentEl.appendChild(groupTable);
		return true;
	}

	#generateExpansionCollection(collectionStructure,mainIndex,collObj,parentEl,path,rowData) {
		Object.assign(collObj,{children:[],struct:collectionStructure,rowData:rowData});
		const container=collObj.containerEl=parentEl.appendChild(document.createElement("div"));
		container.classList.add("collection",...collectionStructure.class?.split(" ")??[]);
		for (let entryI=-1,struct; struct=collectionStructure.entries[++entryI];) {
			path.push(entryI);
			const celObj=collObj.children[entryI]={parent:collObj,index:entryI,struct:struct};
			if (struct.type==="repeated"&&rowData[struct.id]?.length) {
				celObj.children=[];
				for (let repeatI=-1,repeatData;repeatData=rowData[struct.id][++repeatI];) {
					let repeatdObj=celObj.children[repeatI]={parent:celObj,index:repeatI,struct:struct.entry};
					this.#generateCollectionItem(struct,mainIndex,repeatdObj,container,path,repeatData);
				}
			} else {
				this.#generateCollectionItem(struct,mainIndex,celObj,container,path,rowData);
			}
			path.pop();
		}
		return true;
	}

	#generateCollectionItem(struct,mainIndex,cellObj,parentEl,path,data) {
		const containerSpan=cellObj.selEl=document.createElement("span");
		if (struct.title) {
			const header=containerSpan.appendChild(document.createElement("h4"));
			header.innerHTML=struct.title;
		}
		let contentDiv=containerSpan.appendChild(document.createElement("div"));
		contentDiv.className="value";
		if (this.#generateExpansionContent(struct,mainIndex,cellObj,contentDiv,path,data))
			parentEl.appendChild(containerSpan);
		if (struct.class)
			containerSpan.className+=" "+struct.class;
	}

	#generateExpansionList(listStructure,mainIndex,listCelObj,parentEl,path,rowData) {
		listCelObj.children=[];
		const listTable=listCelObj.listTable=document.createElement("table");
		listTable.appendChild(document.createElement("tbody"));
		listTable.className="expansion-list";
		let titlesCol=document.createElement("col");
		listTable.appendChild(document.createElement("colgroup")).appendChild(titlesCol);
		if (listStructure.titlesColWidth)
			titlesCol.style.width=listStructure.titlesColWidth;
		for (let entryI=-1,struct; struct=listStructure.entries[++entryI];) {
			if (struct.type==="repeated") {
				let repeatData=rowData[struct.id];
				let rptCelObj=listCelObj.children[entryI]={parent:listCelObj,index:entryI,children:[],struct:struct};
				if (rowData[struct.id]?.length){
					if (struct.sortCompare)
						(repeatData=[...repeatData]).sort(struct.sortCompare);
					for (const itemData of repeatData) {
						path.push(entryI);
						this.#generateListItem(listTable.firstChild,struct.entry,mainIndex,rptCelObj,path,itemData);
						path.pop();
					}
				}
			} else
				this.#generateListItem(listTable.firstChild,struct,mainIndex,listCelObj,path,rowData);
		}
		parentEl.appendChild(listTable);
		return true;
	}

	#generateListItem(container,struct,mainIndex,parentObj,path,data,insertBeforeEl=null,index=null) {
		let contentTd=document.createElement("td");
		contentTd.className="value";
		let cellChild={parent:parentObj,index:index??parentObj.children.length};
		
		if (index!=null) {
			for (const pathEl of container.querySelectorAll('[data-path]')) {
				const elPath=pathEl.dataset.path.split("-");
				if (elPath[path.length-1]==path[path.length-1]&&elPath[path.length]>=index) {
					elPath[path.length]++;
					pathEl.dataset.path=elPath.join("-");
				}
			}
			//increment index of all the items after the inserted one
			for (let i=parentObj.children.length; i>index; parentObj.children[--i].index++);
		}
		path.push(index??parentObj.children.length);
		if (this.#generateExpansionContent(struct,mainIndex,cellChild,contentTd,path,data)) {//generate content
			//and add it to dom if condition falls true, e.g. content was actually created. it might not be if it is
			//a repeated and there was no data for it add
			for (var containerObj=parentObj; containerObj.struct.type=="repeated"; containerObj=containerObj.parent);
			let listTr=document.createElement("tr");
			container.insertBefore(listTr,insertBeforeEl);
			if (containerObj.struct.type=="list") {
				let titleTd=listTr.insertCell();
				titleTd.className="title";
				titleTd.innerText=struct.title??"";
			}
			listTr.appendChild(contentTd);
			parentObj.children.splice(index??Infinity,0,cellChild);
		}
		path.pop();
		return contentTd;
	}

	#generateField(fieldStructure,mainIndex,cellObject,parentEl,path,rowData) {	
		cellObject.el=parentEl;
		this.#updateExpansionCell(cellObject,rowData);
		cellObject[cellObject.selEl?"selEl":"el"].dataset.path=path.join("-");
		return true;
	}

	#scrollToCursor() {
		const distanceRatioDeadzone=.5;//when moving the cellcursor within this distance from center of view no 
										//scrolling will be done. 0.5 is half of view, 1 is entire height of view
		const distanceRatioCenteringTollerance=1;//if moving the cellcursor within this ratio, but outside of 
					//distanceRatioDeadzone then minimum scrolling will occur only to get within distanceRatioDeadzone
		const scrollPos=this.#scrollBody.scrollTop;
		const scrollHeight=this.#scrollBody.offsetHeight;
		const cursorY=parseInt(this.#cellCursor.style.top);
		const cursorHeight=this.#cellCursor.offsetHeight;
		const distanceFromCenter=cursorY+cursorHeight/2-scrollPos-scrollHeight/2;
		const distanceFromCenterRatio=Math.abs(distanceFromCenter/scrollHeight);
		if (distanceFromCenterRatio>distanceRatioDeadzone/2) {
			if (distanceFromCenterRatio>distanceRatioCenteringTollerance/2)
				this.#scrollBody.scrollTop=cursorY-scrollHeight/2+this.#rowHeight/2;
			else
				this.#scrollBody.scrollTop=cursorY-scrollHeight/2+cursorHeight/2
								+(distanceFromCenter<0?1:-1)*scrollHeight*distanceRatioDeadzone/2;
		}
		//need to call this manually so that elements that are expected to exist after scroll are guaranteed to do so.
		//changing this.#scrollBody.scrollTop actually calls this method anyway but not until all other code as hun.
		//This will cause it to run it twice but it's not a big deal.
		this.#scrollMethod();
	}

	#spreadsheetMouseDown(e) {
		this.#highlightOnFocus=false;//see decleration
		this.#container.style.outline="none";//see #spreadsheetOnFocus
	}
	
	#mainTableMouseDown(e) {
		if (Date.now()<this.#ignoreClicksUntil)//see decleration of #ignoreClicksUntil
			return;
		if (e.which===3)//if right click
			return;
		const mainTr=e.target.closest(".main-table>tbody>tr");
		if (mainTr.classList.contains("expansion")) {//in expansion
			const interactiveEl=e.target.closest('[data-path]');
			if (!interactiveEl)
				return;
			let cellObject=this.#openExpansions[mainTr.dataset.dataRowIndex];
			for (let step of interactiveEl.dataset.path.split("-")) {
				cellObject=cellObject.children[step];
				if (cellObject.struct.type==="group"&&!cellObject.el.classList.contains("open"))
					break;
			}
			/*while (cellObject.children) {
				let childI;
				for (childI=0; childI<cellObject.children.length; childI++) {
					if (cellObject.children[childI].el.contains(e.target)) {
						cellObject=cellObject.children[childI];
						break;
					}
				}
				if (childI==cellObject.children?.length){ //none of the children matched but the parent matched. 
					cellObject=null;
					break
				}
			} */
			this.#selectExpansionCell(cellObject);
		} else {//not in expansion
			const td=e.target.closest(".main-table>tbody>tr>td");
			if (td.classList.contains("expand-col")||td.classList.contains("select-col")) {
				if (e.shiftKey)
					e.preventDefault();//prevent text-selection when shift-clicking checkboxes
				if (this.#mainRowIndex==null) {
					this.#selectMainTableCell(td);
					this.#container.focus();
				}
				if (td.classList.contains("expand-col"))
					return this.#toggleRowExpanded(td.parentElement);
				return this.#rowCheckboxChange(td,e.shiftKey);
			}
			this.#selectMainTableCell(td);
		}
	}

	#toggleRowExpanded(tr) {
		if (tr.classList.contains("expanded"))
			this.#contractRow(tr);
		else
			this.#expandRow(tr);
	}

	#rowCheckboxChange(td,shift) {
		const checked=!td.querySelector("input").checked;
		const mainIndex=parseInt(td.parentElement.dataset.dataRowIndex);
		if (!shift)//shift not held, 
			this.#lastCheckedIndex=mainIndex;//set #lastCheckedIndex to the current index to both start and stop at it
		this.#toggleRowsSelected(checked,...[mainIndex,this.#lastCheckedIndex??mainIndex].sort((a,b)=>a-b));
		this.#lastCheckedIndex=mainIndex;//if shift held next time then rows between this and new mainIndex are checked
	}

	#toggleRowsSelected(checked,fromIndex,toIndex) {
		this.#unsortCol(null,"select");
		for (var i=fromIndex;i<=toIndex; i++){
			if (i>=this.#scrollRowIndex&&i<this.#scrollRowIndex+this.#numRenderedRows) {
				const tr=this.#mainTbody.querySelector(`[data-data-row-index="${i}"]`);
				tr.querySelector(".select-col input").checked=checked;
				tr.classList.toggle("selected",checked);
			}
			if (checked&&this.#selectedRows.indexOf(this.#data[i])==-1) {
				this.#selectedRows.push(this.#data[i]);
				this.#numRowsSelected++;
				this.#numRowsInViewSelected++;
			} else if (!checked&&this.#selectedRows.indexOf(this.#data[i])!=-1) {
				this.#selectedRows.splice(this.#selectedRows.indexOf(this.#data[i]),1);
				this.#numRowsSelected--;
				this.#numRowsInViewSelected--;
			}
		}
		this.#numberOfRowsSelectedSpan.innerText=this.#numRowsSelected;
		this.#updateNumRowsSelectionState();
		this.#updateMultiCellVals();
	}

	#updateNumRowsSelectionState() {
		const checkbox=this.#headerTr.querySelector(".select-col input");
		if (this.#numRowsInViewSelected==this.#data.length||!this.#numRowsInViewSelected) {
			checkbox.indeterminate=false;
			checkbox.checked=this.#numRowsInViewSelected;
		} else
			checkbox.indeterminate=true;
		if (this.#numRowsSelected^this.#multiRowAreaOpen) {
			this.#multiRowAreaOpen=!!this.#numRowsSelected;
			this.#multiRowArea.style.height=this.#numRowsSelected?this.#multiRowAreaHeight:0;
			this.#animate(this.#updateViewportHeight.bind(this),Infinity,"adjustViewportHeight");
		}
	}

	#animate(func,runForMs,id) {
		const runUntil=Date.now()+runForMs;
		const animations=this.#animations;
		if (!animations[id]) {
			animations[id]=runUntil;
			requestAnimationFrame(frame);
		} else
			animations[id]=runUntil;
		function frame() {
			func();
			if (Date.now()<animations[id])
				requestAnimationFrame(frame);
			else
				delete animations[id];
		}
	}

	#autoTextAreaResize(e) {
		const maxHeight=this.#activeStruct.maxHeight??Infinity;
		
		//__auto-resize__
		//first set height to auto.This won't make it auto-resize or anything but will rather set its height to about 40
		e.target.style.height="auto";
		//then set size of cellcursor, and also the underlying cell in order to make expansion-height adjust to scroll-
		//height of the textarea. Also add 1px because *sometimes* without logic the textarea would recieve a scrollbar
		//which can scroll about 1 px. Not sure if 1px is actually sufficent but let's start there.
		this.#cellCursor.style.height=this.#selectedCell.style.height=Math.min(maxHeight,e.target.scrollHeight+1)+"px";
		//now set height of textarea to 100% of cellcursor which height is set with above line. this line and the one
		//setting it to auto "could" be skipped but that will result in the textarea not shrinking when needed.
		e.target.style.height="100%";

		//need to call this to make the height of the expansion adjust and reflect the change in size of the textarea
		this.#updateExpansionHeight(this.#selectedCell.closest("tr.expansion"));
	}

	#updateExpansionHeight(expansionTr) {
		const contentDiv=expansionTr.querySelector(".content");
		const mainRowIndex=parseInt(expansionTr.dataset.dataRowIndex);
		contentDiv.style.height="auto";//set to auto in case of in middle of animation, get correct height
		const prevRowHeight=this.#rowMetaGet(mainRowIndex).h;
		const newRowHeight=this.#rowHeight+expansionTr.offsetHeight+this.#borderSpacingY;
		this.#rowMetaSet(mainRowIndex,"h",newRowHeight);
		this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height)//adjust scroll-height reflect change...
			+newRowHeight-prevRowHeight+"px";//...in height of the table
	}

	#openDateEdit(e) {
		const input=document.createElement("input");
		let pika,pikaContainer;
		//this.#input.type="date";//using Pikaday instead which I find more user-friendly. Calendar can be opened
								//up right away and typing manualy is still permitted
		if (!Pikaday)
			console.warn("Pikaday-library not found");
		else {
			pikaContainer=this.#cellCursor.parentElement.appendChild(document.createElement("div"));
			pikaContainer.className="pika-container";
			pika=new Pikaday({field:input,
				toString: d=>d.getFullYear()+"-"+('0'+(d.getMonth()+1)).slice(-2)+"-"+('0'+d.getDate()).slice(-2),
				onClose:()=>{
					pikaContainer.remove();
					pika.destroy();
					setTimeout(()=>this.#exitEditMode(true));
				},
				container:pikaContainer,
				firstDay:1,//week starts on monday
				showWeekNumber:true,
				i18n: {
					previousMonth : 'Tidigare Månad',
					nextMonth     : 'Nästa Månad',
					months        : ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September'
																					,'Oktober','November','December'],
					weekdays      : ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'],
					weekdaysShort : ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
				},
				onOpen:()=>this.#alignDropdown(pikaContainer)//have to wait until onOpen or size is 0
			});
			pika.el.style.position="static";//otherwise size of pikaContainer will be 0 and alignDropdown wont work
			if (e instanceof KeyboardEvent)
				e.stopPropagation();//otherwise the enter-press is propagated to Pikaday, immediately closing it
			input.addEventListener("input",onInput.bind(this));
			input.addEventListener("change",()=>this.#inputVal=input.value);
		}
		new Cleave(input,{date: true,delimiter: '-',datePattern: ['Y', 'm', 'd']});
		this.#cellCursor.appendChild(input);
		input.value=this.#selectedCellVal??"";
		input.placeholder=this.#activeStruct.input.placeholder??this.#opts.lang?.datePlaceholder??"YYYY-MM-DD";
		input.focus();
		
		function onInput(e) {
			const inputVal=input.value;
			pika.setDate(input.value);
			//the above line will change the text above by guessing where there should be zeroes and such so prevent
			//that by setting it back so that the user can type freely
			input.value=inputVal;
		}
	}

	/**Aligns dropdowns like select and date-picker correctly by the cellcursor */
	#alignDropdown(dropdown) {
		//if cellcursor is below middle of viewport or if in multi-row-area
		if (parseInt(this.#cellCursor.style.top)+this.#cellCursor.clientHeight/2
								>this.#scrollBody.scrollTop+this.#scrollBody.clientHeight/2||this.#multiCellSelected)
			//then place dropdown above cell-cursor
			dropdown.style.top=parseInt(this.#cellCursor.style.top)-dropdown.offsetHeight+"px";
		else
			//else place dropdown below cell-cursor
			dropdown.style.top=parseInt(this.#cellCursor.style.top)+this.#cellCursor.clientHeight+"px";

		//if there's enough space to the right of cellcursor
		if (this.#scrollBody.clientWidth-parseInt(this.#cellCursor.style.left)>dropdown.offsetWidth)
			//then align the left of the dropdown with the left of the cellcursor
			dropdown.style.left=parseInt(this.#cellCursor.style.left)+"px";
		else
			//otherwise align the right of the dropdown with the right of the cellcursor
			dropdown.style.left=parseInt(this.#cellCursor.style.left)
													-(dropdown.offsetWidth-this.#cellCursor.offsetWidth)+"px";
	}

	#enterCell(e) {
		if (this.#inEditMode||this.#cellCursor.classList.contains("disabled"))
			return;
		if (this.#activeStruct.input) {
			e.preventDefault();//prevent text selection upon entering editmode
			if (this.#activeStruct.input.type==="button")
				return this.#activeExpCell.el.click();
			this.#inputVal=this.#selectedCellVal;
			this.#inEditMode=true;
			this.#cellCursor.classList.add("edit-mode");
			({textarea:this.#openTextAreaEdit,date:this.#openDateEdit,select:this.#openSelectEdit
				,file:this.#openFileEdit}[this.#activeStruct.input.type]??this.#openTextEdit).call(this,e);
		} else if (this.#activeStruct.type==="group") {
			this.#activeExpCell.el.classList.add("open");
			this.#selectExpansionCell(this.#getFirstSelectableExpansionCell(this.#activeExpCell,true,true));
		} else if (this.#activeStruct.type==="repeatCreate") {
			this.#repeatInsertNew(this.#activeExpCell);
		}
	}

	#closeGroup(groupObject) {
		groupObject.el.classList.remove("open");
		if (groupObject.updateRenderOnClose) {//if group is flagged for having its closed-render updated on close
			delete groupObject.updateRenderOnClose;//delete the flag so it doesn't get triggered again
			let cell,renderText;
			//look for ancestor-cell with rowData which repeated rows have. It's a sub-data-row of #data.
			//if we got all the way to the root without finding any repeated-rows then use datarow directly from #data
			for (cell=groupObject.parent;!cell.dataObj&&cell.parent;cell=cell.parent);//look for ancestor with rowData
			renderText=groupObject.struct.closedRender(cell.parent?cell.dataObj[cell.index]:this.#data[cell.rowIndex]);
			groupObject.el.rows[groupObject.el.rows.length-1].cells[0].innerText=renderText;
		}
	}

	#repeatInsertNew(repeatCreater) {
		const reptPar=repeatCreater.parent;
		const indexOfNew=reptPar.children.length-1;
		const childObj={parent:reptPar,index:indexOfNew,creating:true};//creating means it hasn't been commited yet
		reptPar.children.splice(indexOfNew,0,childObj);
		const path=repeatCreater.el.dataset.path.split("-") ;
		const data=reptPar.dataObj[indexOfNew]={};		
		let struct=reptPar.struct;
		if (struct.create&&struct.entry.type==="group")
			(struct={...struct}).entry=this.#getGroupStructCopyWithDeleteControls(struct.entry);//copy repeat-struct not
			//to edit the original. Then add delete-controls to its inner group which also gets copied.
		this.#generateExpansionContent(struct.entry,indexOfNew,childObj,repeatCreater.el.parentNode,path,data);
		for (var cellPar=childObj,cellI=0,cell=childObj;cell.struct.type!="field";cell=cellPar.children[cellI++]){
			if (cell.struct.type==="group")
				cell.el.classList.add("open");
			if (cell.children) {
				cellPar=cell;
				cellI=0;
			}
		}
		repeatCreater.index++;
		repeatCreater.el.parentElement.appendChild(repeatCreater.el);
		this.#selectExpansionCell(cell);
	}

	#deleteCell(cellObj) {
		let newSelectedCell;
		for (let i=cellObj.index,otherCell; otherCell=cellObj.parent.children[++i];)
			otherCell.index--;
		
		if (cellObj.parent.children.length>=cellObj.index+1)
			newSelectedCell=cellObj.parent.children[cellObj.index+1];
		else if (cellObj.parent.children.length>1)
			newSelectedCell=cellObj.parent.children[cellObj.index-1];
		cellObj.parent.children.splice(cellObj.index,1);
		cellObj.parent.dataObj.splice(cellObj.index,1);
		cellObj.el.remove();
		this.#selectExpansionCell(newSelectedCell??cellObj.parent.parent);


		//correct the dataset.path of clickable elements so they can still be clicked
		const path=[];//get the current path
		let rootEl;
		for (let pathCell=cellObj;pathCell;pathCell=pathCell.parent) {
			if (pathCell.index!=null)
				path.unshift(pathCell.index);
			rootEl=pathCell.el??pathCell.selEl??rootEl;
		}
		for (const pathEl of rootEl.closest(".expansion").querySelectorAll('[data-path]')) {
			const otherPath=pathEl.dataset.path.split("-");
			for (var i=0; i<path.length-1&&path[i]==otherPath[i]; i++);
			if (i==path.length-1&&otherPath[i]>path[i]) {
				otherPath[i]--;
				pathEl.dataset.path=otherPath.join("-");
			}
		}
	}

	#openTextEdit() {
		const input=this.#cellCursor.appendChild(document.createElement("input"));
		input.addEventListener("blur",()=>setTimeout(this.#exitEditMode.bind(this)));
		input.addEventListener("change",()=>this.#inputVal=input.value);
		input.value=this.#selectedCellVal??"";
		input.focus();
		if (this.#activeStruct.input.maxLength)
			input.maxLength=this.#activeStruct.input.maxLength;
		input.placeholder=this.#activeStruct.input.placeholder??"";
		if (this.#activeStruct.input.cleave)
			new Cleave(input,this.#activeStruct.input.cleave);
	}

	#mapAdd(map,key,val) {
		map.keys.push(key);
		map.vals.push(val);
	}

	#mapGet(map,key) {
		const index=map.keys.indexOf(key);
		if (index!=-1)
			return map.vals[index];
	}

	#mapRemove(map,key) {
		const index=map.keys.indexOf(key);
		map.keys.splice(index,1);
		map.vals.splice(index,1);
	}

	#openFileEdit() {
		const self=this;
		window.getSelection().empty();
		const fileDiv=this.#cellCursor.appendChild(document.createElement("div"));
		fileDiv.classList.add("file");
		fileDiv.tabIndex="0";
		fileDiv.focus();
		const fileInput=fileDiv.appendChild(document.createElement("input"));
		fileInput.type="file";

		fileDiv.innerHTML=this.#opts.lang?.fileChooseOrDrag??"<b>Press to choose a file</b> or drag it here";
		const dropDiv=fileDiv.appendChild(document.createElement("div"));
		dropDiv.innerHTML=this.#opts.lang?.fileDropToUpload??"Drop to upload";
		dropDiv.classList.add("drop");
		fileDiv.addEventListener("keydown",keydown);
		fileDiv.addEventListener("click",openFileBrowser);
		fileDiv.addEventListener("dragenter",e=>dropDiv.style.display="block");
		dropDiv.addEventListener("dragleave",e=>dropDiv.style.display="none");
		dropDiv.addEventListener("dragover",dragOver);//needed for drop-event to work
		fileDiv.addEventListener("drop",fileDrop);
		fileInput.addEventListener("change",fileChange);
		function keydown(e) {
			if (e.key==="Escape")
				return;//let the main keydown-handler of Tablance handle this instead
			e.stopPropagation();
			if (e.key.slice(0,5)=="Arrow")
				e.preventDefault();//prevent native arrow-scrolling
			else if (e.key==="Enter"||e.key===" ") {
				e.preventDefault();//prevent native space-scrolling
				openFileBrowser();
			}
		}
		function handleFile(file) {
			self.#inputVal=file;
			const fileMeta={uploadedBytes:0,bars:[]};
			self.#mapAdd(self.#filesMeta,file,fileMeta)
			const xhr = new XMLHttpRequest();
			xhr.upload.addEventListener("progress",e=>{
				for (let barI=-1,bar; bar=fileMeta.bars[++barI];) {
					if (bar.isConnected) {
						fileMeta.uploadedBytes=e.loaded;
						bar.style.width=bar.firstChild.innerText=parseInt(e.loaded/e.total*100)+"%";
					} else
						fileMeta.bars.splice(barI--,1);
				}
			});
			self.#activeStruct.input.fileUploadHandler?.
						(xhr,file,self.#activeStruct,self.#cellCursorDataObj,self.#mainRowIndex,self.#activeExpCell);
			xhr?.addEventListener("load",e=>{
				self.#mapRemove(self.#filesMeta,file);//can get rid of our metadata now
				for (const bar of fileMeta.bars) {
					if (bar.isConnected) {
						bar.parentElement.classList.remove("active");
						bar.firstChild.innerText=self.#opts.lang?.fileUploadDone??"Done!";
					}
						
				}
			});
			const formData = new FormData();
			formData.append("file", file);
			xhr.send(formData);
			self.#exitEditMode(true);
			self.#selectExpansionCell(self.#activeExpCell);
		}
		function openFileBrowser(e) {
			fileInput.click();
		}
		function fileChange(e) {
			handleFile(e.target.files[0]);
		}
		function dragOver(e) {
			e.preventDefault();//without this the drop-event wont even fire
		}
		function fileDrop(e) {
			e.stopPropagation();
			e.preventDefault();
			handleFile(e.dataTransfer.files[0]);
		}
	}

	#openTextAreaEdit() {
		const textarea=this.#cellCursor.appendChild(document.createElement("textarea"));
		textarea.addEventListener('input', this.#autoTextAreaResize.bind(this));

		{	const {paddingLeft,paddingRight,paddingTop,paddingBottom}=window.getComputedStyle(this.#selectedCell);
			//add the padding of the cell to the textarea for consistency
			Object.assign(textarea.style,{paddingLeft,paddingRight,paddingTop,paddingBottom});}
		
		textarea.value=this.#selectedCellVal??"";
		textarea.addEventListener("keydown",keydown.bind(this));
		textarea.focus();
		textarea.addEventListener("change",e=>this.#inputVal=textarea.value);
		if (this.#activeStruct.input.maxLength)
			textarea.maxLength=this.#activeStruct.input.maxLength;
		textarea.placeholder=this.#activeStruct.input.placeholder??"";
		function keydown(e) {
			if (e.key==="Enter"&&e.ctrlKey) {
				this.#insertAtCursor(textarea,"\r\n");
				textarea.dispatchEvent(new Event('input'));//trigger input so that autoTextAreaResize gets called
				e.stopPropagation();
			} else if (e.key==="Escape") {
				textarea.value=this.#selectedCellVal??"";
				textarea.dispatchEvent(new Event('input'));
			}
		}
	}

	#openSelectEdit() {
		const self=this;//to have access to this(tablance-instance) inside closures
		let highlightLiIndex,highlightUlIndex;
		let filterText="";
		const strctInp=this.#activeStruct.input;
		this.#inputVal=this.#cellCursorDataObj[this.#activeStruct.id];
		const selectContainer=document.createElement("div");
		let opts=[...strctInp.options];
		const inputWrapper=selectContainer.appendChild(document.createElement("div"));//used to give the input margins
		const input=inputWrapper.appendChild(document.createElement("input"));
		const windowMouseDownBound=windowMouseDown.bind(this);//saving ref to bound func so handler can be removed later
		const allowEmpty=strctInp.allowSelectEmpty??true;
		let canCreate=false;//whether the create-button is currently available.This firstly depends on input.allowCreate
					//but also the current value of the input and if there already is an option matching that exactly
		const emptyString=strctInp.emptyOptString??this.#opts.lang.selectEmptyOpt??"Empty";
		inputWrapper.classList.add("input-wrapper");//input-element a margin. Can't put padding in container because
							//that would cause the highlight-box of selected options not to go all the way to the sides
		const ulDiv=selectContainer.appendChild(document.createElement("div"));
		if (strctInp.allowCreateNew||opts.length>=(strctInp.minOptsFilter??this.#opts.defaultMinOptsFilter??5)) {
			input.addEventListener("input",inputInput.bind(this));//filtering is allowed, add listener to the input
		} else//else hide the input. still want to keep it to recieve focus and listening to keystrokes. tried focusing
			inputWrapper.classList.add("hide");//container-divs instead of input but for some reason it messed up scroll
		input.addEventListener("keydown",inputKeyDown.bind(this));
		input.placeholder=strctInp.selectInputPlaceholder??"";
		input.addEventListener("blur",input.focus)
		const pinnedUl=ulDiv.appendChild(document.createElement("ul"));
		const mainUl=ulDiv.appendChild(document.createElement("ul"));
		pinnedUl.classList.add("pinned");
		for (let i=-1,ul;ul=[pinnedUl,mainUl][++i];) {
			ul.dataset.ulIndex=i;
			ul.addEventListener("mouseover",ulMouseOver.bind(this));
			ul.addEventListener("click",ulClick.bind(this));
		}
		
		if (allowEmpty) {
			const emptyLi=pinnedUl.appendChild(document.createElement("li"));
			emptyLi.innerHTML=emptyString;
			emptyLi.dataset.type="empty";//to identify what the option does if selected
			if (this.#inputVal==null) {
				emptyLi.classList.add("selected","highlighted");
				highlightLiIndex=pinnedUl.children.length-1;
				highlightUlIndex=0;
			}
		}
		let creationLi;
		if (strctInp.allowCreateNew) {
			creationLi=document.createElement("li");
			creationLi.dataset.type="create";
		}
		
		renderOpts(mainUl,opts,this.#inputVal);
		
		const noResults=selectContainer.appendChild(document.createElement("div"));
		noResults.innerHTML=strctInp.noResultsText??this.#opts.lang?.selectNoResultFound??"No results found";
		noResults.className="no-results";
		
		this.#cellCursor.parentElement.appendChild(selectContainer);
		selectContainer.className="tablance-select-container";
		this.#alignDropdown(selectContainer);
		window.addEventListener("mousedown",windowMouseDownBound);
		input.focus();

		function renderOpts(ul,opts,selectedVal) {
			let foundSelected=false;
			ul.innerHTML="";
			for (const opt of opts) {
				const li=ul.appendChild(document.createElement("li"));
				li.innerText=opt.text;
				if ((selectedVal!=null&&selectedVal==opt.value)||selectedVal==opt) {
					foundSelected=true;
					li.classList.add("selected","highlighted");
					highlightLiIndex=ul.children.length-1;
					highlightUlIndex=parseInt(ul.dataset.ulIndex);
				}
			}
			return foundSelected;
		}

		function inputInput(e) {
			canCreate=!!input.value;
			if (!input.value.includes(filterText)||!filterText)//unless text was added to beginning or end
				opts=[...strctInp.options];//start off with all options there are
			for (let i=-1,opt; opt=opts[++i];)
				if (!opt.text.includes(input.value))//if searchstring wasn't found in this opt
					opts.splice(i--,1);//then remove it from view
				else if (opt.text.toLowerCase()==input.value.toLowerCase())
					canCreate=false;
			if (canCreate)
				pinnedUl.appendChild(creationLi);
			else
				pinnedUl.removeChild(creationLi);
			if (renderOpts(mainUl,opts,this.#inputVal))//found selected opt
				pinnedUl.querySelector(".highlighted")?.classList.remove("highlighted");
			else//did not find selected opt
				if (highlightUlIndex)//...and empty is not selected
					if (opts.length)//there are visible opts
						highlightOpt.call(this,1,0);//select first among the filtered ones
					else if (pinnedUl.children.length)
						highlightOpt.call(this,0,0);
			noResults.style.display=opts.length?"none":"block";
			creationLi.innerText=`Create [${filterText=input.value}]`;
		}
		function ulMouseOver(e) {
			highlightOpt.call(this,parseInt(e.target.closest("ul").dataset.ulIndex)
																,[...e.target.parentNode.children].indexOf(e.target));
		}
		function windowMouseDown(e) {
			for (var el=e.target; el!=selectContainer&&(el=el.parentElement););//go up until container or root is found
			if (!el) {//click was outside select-container
				close();
				this.#exitEditMode(false);
			}
		}
		function close(e) {
			if (!highlightUlIndex&&pinnedUl.children[highlightLiIndex].dataset.type=="create") {
					strctInp.options.push(self.#inputVal={text:filterText});
					strctInp.createNewOptionHandler?.(self.#inputVal,e,self.#cellCursorDataObj,self.#mainRowIndex
																			,self.#activeStruct,self.#activeExpCell);
			} else
				self.#inputVal=highlightUlIndex?opts[highlightLiIndex]:null;
			selectContainer.remove();
			window.removeEventListener("mousedown",windowMouseDownBound);
		}
		function highlightOpt(ulIndex,liIndex) {
			ulDiv.getElementsByClassName("highlighted")[0]?.classList.remove("highlighted");
			ulDiv.children[highlightUlIndex=ulIndex].children[highlightLiIndex=liIndex].classList.add("highlighted");
		}
		function inputKeyDown(e) {
			if (["ArrowDown","ArrowUp"].includes(e.key)){
				e.preventDefault();//prevents moving the textcursor when pressing up or down
				const newIndex=highlightLiIndex==null?0:highlightLiIndex+(e.key==="ArrowDown"?1:-1);
				if (highlightUlIndex??true) {//currently somewhere in the main ul
					if (opts.length&&newIndex<opts.length&&newIndex>=0)//moving within main
						highlightOpt(1,newIndex);
					else if (newIndex==-1&&pinnedUl.children.length)//moving into pinned
						highlightOpt(0,pinnedUl.children.length-1);
				} else if (newIndex>=0&&newIndex<pinnedUl.children.length)//moving within pinned
					highlightOpt(0,newIndex);
				else if (newIndex>=pinnedUl.children.length&&opts.length) //moving from pinned to main
					highlightOpt(1,0);
			} else if (e.key==="Enter") {
				close(e);
				this.#moveCellCursor(0,e.shiftKey?-1:1);
				e.stopPropagation();
			} else if (e.key==="Escape")
				close(e);
		}
		function ulClick(e) {
			if (e.target.tagName.toLowerCase()=="li") {//not sure if ul could be the target? check here to make sure
				highlightUlIndex=e.currentTarget.dataset.ulIndex;
				highlightLiIndex=Array.prototype.indexOf.call(e.currentTarget.children, e.target);
				close();
				this.#exitEditMode(true);
			}
		}
	}

	#exitEditMode(save) {
		if (!this.#inEditMode)
			return;
			
		//make the table focused again so that it accepts keystrokes and also trigger any blur-event on input-element
		this.#container.focus();//so that #inputVal gets updated

		this.#inEditMode=false;
		this.#cellCursor.classList.remove("edit-mode");
		if (save&&this.#inputVal!=this.#selectedCellVal) {
			if (this.#multiCellSelected) {
				for (const selectedRow of this.#selectedRows)
					selectedRow[this.#activeStruct.id]=this.#inputVal;
				for (const selectedTr of this.#mainTbody.querySelectorAll("tr.selected"))
					this.#updateMainRowCell(selectedTr.cells[this.#mainColIndex],this.#activeStruct);
				this.#multiCellsDataObj[this.#activeStruct.id]=this.#inputVal;
				const multiCell=this.#multiCells[this.#multiCellIds.indexOf(this.#activeStruct.id)];
				multiCell.innerText=this.#inputVal?.text??this.#inputVal??"";
				multiCell.classList.remove("mixed");
			} else {
				this.#activeStruct.input.onChange?.(this.#inputVal,this.#selectedCellVal,this.#cellCursorDataObj
																			,this.#activeStruct,this.#activeExpCell);
				this.#cellCursorDataObj[this.#activeStruct.id]=this.#inputVal;
				if (this.#activeExpCell){
					const doHeightUpdate=this.#updateExpansionCell(this.#activeExpCell,this.#cellCursorDataObj);
					if (doHeightUpdate)
						this.#updateExpansionHeight(this.#selectedCell.closest("tr.expansion"));
					for (let cell=this.#activeExpCell.parent; cell; cell=cell.parent)//update closed-group-renders
						if (cell.struct.closedRender)//found a group with a closed-group-render func
							cell.updateRenderOnClose=true;
				} else {
					this.#updateMultiCellVals([this.#activeStruct.id]);
					this.#updateMainRowCell(this.#selectedCell,this.#activeStruct);
					this.#unsortCol(this.#activeStruct.id);
				}
			}
		}
		this.#cellCursor.innerHTML="";
		//if (this.#activeStruct.input.type==="textarea")//also needed for file..
		this.#adjustCursorPosSize(this.#selectedCell);
		this.#highlightOnFocus=false;
	}

	#commitRepeatedInsert(repeatEntry) {
		repeatEntry.creating=false;
		repeatEntry.parent.struct.onCreate?.(repeatEntry.dataObj,repeatEntry)
	}

	#closeActiveExpCell() {
		if (this.#activeExpCell) {
			for (let oldCellParent=this.#activeExpCell; oldCellParent=oldCellParent.parent;) {
				if (oldCellParent.struct.type==="group") {
					this.#closeGroup(oldCellParent);//close any open group above old cell
					this.#ignoreClicksUntil=Date.now()+500;
				}
				if (oldCellParent.creating)
					this.#commitRepeatedInsert(oldCellParent);
				oldCellParent.struct.onBlur?.(oldCellParent,this.#mainRowIndex);
			}
			this.#activeExpCell=null;//should be null when not inside expansion
		}
	}


	#selectMainTableCell(cell) {
		if (!cell)//in case trying to move up from top row etc
			return;
		this.#mainColIndex=cell.cellIndex;
		this.#mainRowIndex=parseInt(cell.parentElement.dataset.dataRowIndex);
		this.#selectCell(false,cell,this.#colStructs[this.#mainColIndex],this.#data[this.#mainRowIndex]);
		this.#closeActiveExpCell();
	}

	#selectExpansionCell(cellObject) {
		if (!cellObject)
			return;

		//remove cellcursor click-through in case an expand-button-cell was previously selected
		//this.#cellCursor.style.pointerEvents="auto";
		for (var root=cellObject; root.parent; root=root.parent);
		this.#mainRowIndex=root.rowIndex;;
		if (this.#activeExpCell)//changing from an old expansionCell
			for (let oldParnt=this.#activeExpCell; oldParnt=oldParnt?.parent;)//traverse parents of old cell
				if(oldParnt.struct.type==="group"||oldParnt.struct.onBlur||oldParnt.creating){//found a group or cell
					//...with onBlur or cell that is being created. For any of these we want to observe the cell being
					//left so that appropriate action can be taken
					for (let newParent=cellObject; newParent=newParent.parent;)//traverse parents of new cell
						if (newParent===oldParnt) {//if this new parent-group is also part of old parents
							oldParnt=null;//break out of outer loop
							break;
						}
					if (oldParnt) {
						if (oldParnt.struct.type==="group") {
							this.#closeGroup(oldParnt)//if old parent-group is not part of new then close it
							this.#ignoreClicksUntil=Date.now()+500;
						}
						if (oldParnt.struct.onBlur)
							oldParnt.struct.onBlur?.(oldParnt,this.#mainRowIndex);
						if (oldParnt.creating)
							this.#commitRepeatedInsert(oldParnt);
					}
				}
		this.#selectCell(false,cellObject.selEl??cellObject.el,cellObject.struct,cellObject.dataObj);
		this.#activeExpCell=cellObject;
	}

	#selectMultiCell(cell) {
		if (!cell)
			return;
		this.#selectCell(true,cell,this.#colStructs[this.#mainColIndex=cell.dataset.colIndex],this.#multiCellsDataObj);
		this.#mainRowIndex=null;
		this.#closeActiveExpCell();
		const cellPos=cell.getBoundingClientRect();
		const parentBR=this.#multiRowArea.firstChild.getBoundingClientRect();
		this.#cellCursor.style.height=cellPos.height+"px";
		this.#cellCursor.style.width=cellPos.width+"px";
		this.#cellCursor.style.top=cellPos.top-parentBR.top+"px";
		this.#cellCursor.style.left=cellPos.left-parentBR.left+"px";
	}

	#selectCell(isMultiCell,cellEl,struct,dataObj) {
		this.#exitEditMode(true);
		this.#multiCellSelected=isMultiCell;
		this.#adjustCursorPosSize(cellEl);
		this.#cellCursor.classList.toggle("expansion",cellEl.closest("tr.expansion"));
		this.#cellCursor.classList.toggle("disabled",cellEl.classList.contains("disabled"));
		(isMultiCell?this.#multiRowArea.firstChild:this.#scrollingContent).appendChild(this.#cellCursor);
		this.#selectedCell=cellEl;
		this.#activeStruct=struct;
		//make cellcursor click-through if it's on an expand-row-button-td, select-row-button-td or button
		const noPtrEvent=struct.type==="expand"||struct.type==="select"||struct.input?.type==="button";
		this.#cellCursor.style.pointerEvents=noPtrEvent?"none":"auto";
		this.#cellCursorDataObj=dataObj;
		this.#selectedCellVal=dataObj?.[struct.id];
	}

	#adjustCursorPosSize(el,onlyPos=false) {
		if (!el)
			return;
		const cellPos=el.getBoundingClientRect();
		const contPos=(this.#multiCellSelected?this.#multiRowArea.firstChild:this.#tableSizer).getBoundingClientRect();
		this.#cellCursor.style.top=cellPos.y-contPos.y+this.#tableSizer.offsetTop+"px";
		this.#cellCursor.style.left=cellPos.x-contPos.x+"px";
		this.#cellCursor.style.display="block";//it starts at display none since #setupSpreadsheet, so make visible now
		if (!onlyPos) {
			this.#cellCursor.style.height=cellPos.height+"px";
			this.#cellCursor.style.width=cellPos.width+"px";
		}
	}

	#createTableHeader() {
		this.#headerTable=this.#container.appendChild(document.createElement("table"));
		this.#headerTable.classList.add("header-table");
		const thead=this.#headerTable.appendChild(document.createElement("thead"));
		this.#headerTr=thead.insertRow();
		for (let col of this.#colStructs) {
			let th=this.#headerTr.appendChild(document.createElement("th"));
			th.addEventListener("click",e=>this.#onThClick(e));
			if (col.type=="select") {
				th.appendChild(this.#createCheckbox());
				th.classList.add("select-col");
			} else if (col.type=="expand") {
				const expandDiv=th.appendChild(document.createElement("div"));
				expandDiv.classList.add("expand-div");//used to identify if expand-button was clicked in click-handler
				//expandDiv.appendChild(this.#createExpandContractButton());//functionality not fully implemented yet
				th.classList.add("expand-col");
			} else
				th.innerText=col.title??"\xa0";//non breaking space if nothing else or else
																	//sorting arrows wont be positioned correctly

			//create the divs used for showing html for sorting-up/down-arrow or whatever has been configured
			col.sortDiv=th.appendChild(document.createElement("DIV"));
			col.sortDiv.className="sortSymbol";
		}
		this.#headerTr.appendChild(document.createElement("th"));
	}

	#onThClick(e) {
		const clickedIndex=e.currentTarget.cellIndex;
		if (this.#colStructs[clickedIndex].type=="select"&&e.target.tagName.toLowerCase()=="input")
			return this.#toggleRowsSelected(e.target.checked,0,this.#data.length-1);
		if (e.target.closest(".expand-div"))
			return this.#expandOrContractAll(!e.target.closest("tr").classList.contains("expanded"));
		let sortingColIndex=-1,sortingCol;
		while (sortingCol=this.#sortingCols[++sortingColIndex]) {
			if (sortingCol.index===clickedIndex) {
				if (e.shiftKey&&this.#sortingCols.length>1&&sortingCol.order=="desc") {
					this.#sortingCols.splice(sortingColIndex,1);
					sortingColIndex=0;//to not make condition below loop fall true
				} else
					sortingCol.order=sortingCol.order=="asc"?"desc":"asc";
				if (!e.shiftKey)
					this.#sortingCols=[sortingCol];
				break;
			}
		}
		if (sortingColIndex==this.#sortingCols.length) {//if the clicked header wasn't sorted upon at all
			const {id,type}=this.#colStructs[clickedIndex];
			const sortCol={id,type,order:"asc",index:clickedIndex};
			if (!e.shiftKey)
				this.#sortingCols=[];
			this.#sortingCols.push(sortCol);
		}
		this.#updateHeaderSortHtml();
		e.preventDefault();//prevent text-selection when shift-clicking and double-clicking
		this.#sortData();
		this.#refreshTable();
	}

	#expandOrContractAll(expand) {
		this.#scrollBody.scrollTop=0;
		this.#scrollMethod();
		let rows;
		if (expand) {
			rows=this.#tableSizer.querySelectorAll(".main-table>tbody>tr:not(.expansion):not(.expanded)");
			for (const row of rows)
				this.#expandRow(row);
			for (const dataRow of this.#data) {
				const index=this.#rowsMeta.keys.indexOf(dataRow);
				if (index!=-1) {
					this.#rowsMeta.vals[index].h??=-1;
				} else {
					this.#rowsMeta.keys.push(dataRow);
					this.#rowsMeta.vals.push({h:-1});
				}
			}

		}
		

		//#expandRow(tr,dataRowIndex) {
	}

	#updateHeaderSortHtml() {
		for (let [thIndex,th] of Object.entries(this.#headerTr.cells)) {
			if (thIndex==this.#headerTr.cells.length-1)
				break;
			let order=null;
			let sortDiv=this.#colStructs[thIndex].sortDiv;
			for (let sortingCol of this.#sortingCols) {
				if (sortingCol.index==thIndex) {
					order=sortingCol.order;
					break;
				}
			}
			if (!order||th.classList.contains(order=="asc"?"desc":"asc"))
				th.classList.remove("asc","desc");
			if (order) {
				th.classList.add(order);
				sortDiv.innerHTML=(order=="asc"?this.#opts?.sortAscHtml:this.#opts?.sortDescHtml)??"";
			} else
				sortDiv.innerHTML=this.#opts?.sortNoneHtml??"";
		}
	}

	#sortData() {
		const sortCols=this.#sortingCols;
		if (!sortCols.length)
			return false;
		this.#data.sort(compare.bind(this));
		this.#mainRowIndex=this.#data.indexOf(this.#cellCursorDataObj);
		return true;
		
		function compare(a,b) {
			for (let sortCol of sortCols) {
				if (sortCol.type==="expand") {
					let aV;
					if ((aV=!!this.#rowMetaGet(this.#data.indexOf(a))?.h)!=!!this.#rowMetaGet(this.#data.indexOf(b))?.h)
						return (aV?-1:1)*(sortCol.order=="asc"?1:-1);
				} else if (sortCol.type==="select") {
					let aSel;
					if ((aSel=this.#selectedRows.indexOf(a)!=-1)!=(this.#selectedRows.indexOf(b)!=-1))
						return (aSel?-1:1)*(sortCol.order=="asc"?1:-1);
				} else if (a[sortCol.id]!=b[sortCol.id])
					return (a[sortCol.id]>b[sortCol.id]?1:-1)*(sortCol.order=="asc"?1:-1);
			}
		}
	}

	#createTableBody() {
		this.#scrollBody=this.#container.appendChild(document.createElement("div"));

		if (this.#staticRowHeight&&!this.#expansion)
			this.#scrollMethod=this.#onScrollStaticRowHeightNoExpansion;
		else if (this.#staticRowHeight&&this.#expansion)
			this.#scrollMethod=this.#onScrollStaticRowHeightExpansion;
		this.#scrollBody.addEventListener("scroll",e=>this.#scrollMethod(e),{passive:true});
		this.#scrollBody.className="scroll-body";
		
		this.#scrollingContent=this.#scrollBody.appendChild(document.createElement("div"));
		this.#scrollingContent.className="scrolling-content";

		this.#tableSizer=this.#scrollingContent.appendChild(document.createElement("div"));
		this.#tableSizer.style.position="relative";
		this.#tableSizer.style.top="0px";//need to have so that scrolling works properly when reading parseInt of it
		this.#tableSizer.className="table-sizer";

		this.#mainTable=this.#tableSizer.appendChild(document.createElement("table"));
		this.#mainTable.className="main-table";
		this.#mainTbody=this.#mainTable.appendChild(document.createElement("tbody"));
		for (let colStruct of this.#colStructs) {
			let col=document.createElement("col");
			this.#cols.push(col);
			this.#mainTable.appendChild(document.createElement("colgroup")).appendChild(col);
		}
		this.#borderSpacingY=parseInt(window.getComputedStyle(this.#mainTable)['border-spacing'].split(" ")[1]);
	}

	#createMultiRowArea() {
		this.#multiRowArea=this.#container.appendChild(document.createElement("div"));
		this.#multiRowArea.classList.add("multi-row-section");
		this.#multiRowArea.style.height=0;
		this.#multiRowArea.addEventListener("transitionend",()=>delete this.#animations["adjustViewportHeight"]);

		//extra div needed for having padding while also being able to animate height all the way to 0
		const multiRowAreaContent=this.#multiRowArea.appendChild(document.createElement("div"));

		const numberOfRowsSelectedDiv=multiRowAreaContent.appendChild(document.createElement("div"));
		numberOfRowsSelectedDiv.innerText="Number of selected rows: ";
		this.#numberOfRowsSelectedSpan=numberOfRowsSelectedDiv.appendChild(document.createElement("span"));
		const cellMouseDown=e=>{
			e.preventDefault();//prevent selection of the cell-content on dbl-click
			this.#selectMultiCell(e.target)
		};
		const colsDiv=multiRowAreaContent.appendChild(document.createElement("div"));
		this.#multiCellIds=[];
		this.#multiCells=[];
		this.#multiCellsDataObj={};
		for (let colI=-1,colStruct; colStruct=this.#colStructs[++colI];) {
			if (colStruct.input) {
				const colDiv=colsDiv.appendChild(document.createElement("div"));
				const header=document.createElement("h3");
				colDiv.appendChild(header).innerText=colStruct.title;
				colDiv.classList.add("col");
				colDiv.style.width=colStruct.input.multiCellWidth??
											(/\d+\%/.test(colStruct.width)?colStruct.width:header.offsetWidth+30)+"px";
				const cellDiv=colDiv.appendChild(document.createElement("div"));
				this.#multiCells[this.#multiCellIds.push(colStruct.id)-1]=cellDiv;
				cellDiv.classList.add("cell");
				cellDiv.dataset.colIndex=colI;
				cellDiv.addEventListener("mousedown",cellMouseDown);
			}
		}
	}

	/**Updates the displayed values in #multiRowArea* */
	#updateMultiCellVals(idsToUpdate=this.#multiCellIds) {
		const mixedText="(Mixed)";
		for (let multiCellI=-1, multiCellId; multiCellId=idsToUpdate[++multiCellI];) {
			let colVal=this.#selectedRows[0]?.[multiCellId];
			let mixed=false;
			for (let rowI=0,row; row=this.#selectedRows[++rowI];) {
				if (row[multiCellId]!=colVal) {
					mixed=true;
					break;
				}
			}
			this.#multiCellsDataObj[multiCellId]=mixed?"":colVal;
			const cellIndex=this.#multiCellIds.indexOf(multiCellId);
			this.#multiCells[cellIndex].innerText=mixed?mixedText:colVal?.text??colVal??"";
			this.#multiCells[cellIndex].classList.toggle("mixed",mixed);
		}
	}

	#updateViewportHeight() {
		this.#scrollBody.style.height=this.#container.clientHeight-this.#headerTable.offsetHeight
				-(this.#searchInput?.offsetHeight??0)-this.#multiRowArea.offsetHeight+"px";
	}

	#updateSizesOfViewportAndCols() {
		if (this.#container.offsetHeight!=this.#containerHeight) {
			this.#updateViewportHeight();
			if (this.#container.offsetHeight>this.#containerHeight)
				this.#maybeAddTrs();
			else
				this.#maybeRemoveTrs();
			this.#containerHeight=this.#container.offsetHeight;
		}
		this.#updateColsWidths();

		this.#headerTable.style.width=this.#scrollBody.offsetWidth+"px";
		this.#adjustCursorPosSize(this.#selectedCell);
	}

	#updateColsWidths() {
		if (this.#container.offsetWidth>this.#containerWidth) {
			let areaWidth=this.#tableSizer.offsetWidth;
			const percentageWidthRegex=/\d+\%/;
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
					sumFixedAndFlexibleWidth+=(col.pxWidth=(areaWidth-totalFixedWidth)*parseFloat(col.width)/100);
			for (let col of this.#colStructs)
				if (!col.width)//if undefined width
					col.pxWidth=(areaWidth-sumFixedAndFlexibleWidth)/numUndefinedWidths;
			for (var colI=0; colI<this.#colStructs.length; colI++) 
				this.#cols[colI].style.width=this.#headerTr.cells[colI].style.width=this.#colStructs[colI].pxWidth+"px";
			//last col is empty col with the width of table-scrollbar if its present in order to make the header span
			//the whole with while not actually using that last bit in the calculations for the normal cols
			this.#headerTr.cells[colI].style.width=this.#scrollBody.offsetWidth-areaWidth+"px";
		}
	}

	#filterData(filterString) {
		this.#openExpansions={};
		this.#rowsMeta={keys:[],vals:[]};
		for (const tr of this.#mainTbody.querySelectorAll("tr.expansion"))
		 	tr.remove();
		this.#filter=filterString;
		const colsToFilterBy=[];
		const selectsOptsByVal={};//for each col that is of the select type, a entry will be placed in this with the
			//col-index as key and an object as val. the object holds all the options but they are keyed by teir value
			//rather than being in an indexed array.This is to simplify and likely improve speed of filtering by the col

		for (let col of this.#colStructs)
			if (col.type!=="expand"&&col.type!=="select") {
				if (col.input?.type=="select") {
					const optsByVal=selectsOptsByVal[colsToFilterBy.length]={};
					for (const opt of col.input.options)
						optsByVal[opt.value]=opt;
				}
				colsToFilterBy.push(col);
			}
		if (filterString) {
			this.#data=[];
			for (let dataRow of this._allData)
				for (let colI=-1,col; col=colsToFilterBy[++colI];) {
					if (dataRow[col.id]!=null) {
						let match=false;
						if (col.input?.type=="select") {
							if (typeof dataRow[col.id]=="string")
								match=selectsOptsByVal[dataRow[col.id]].text.includes(filterString);
							else
								match=dataRow[col.id].text.includes(filterString);
						} else
							match=dataRow[col.id].includes(filterString);
						if (match) {
							this.#data.push(dataRow);
							break;
						}
					}
				}
		} else
			this.#data=this._allData;
		this.#scrollRowIndex=0;
		this.#refreshTable();
		this.#refreshTableSizerNoExpansions();
	}

	addData(data, highlight=false) {
		const oldLen=this.#data.length;
		if (highlight)
			this.#searchInput.value=this.#filter="";//remove any filter
		this.#data=this._allData=this._allData.concat(data);
		//this.#data.push(...data);//much faster than above but causes "Maximum call stack size exceeded" for large data
		let sortingOccured=this.#sortData();
		if (this.#filter)
			this.#filterData(this.#filter);
		else {
			if (sortingOccured)
				this.#refreshTable();
			else
				this.#maybeAddTrs();
			const numNewInData=this.#data.length-oldLen;
			this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height||0)+numNewInData*this.#rowHeight+"px";
		}
		if (highlight) {
			for (let dataRow of data)
				this.#highlightRowIndex(this.#data.indexOf(dataRow));
			this.scrollToDataRow(data[0],false);//false for not highlighting, above line does the highlight anyway
		}
	}

	/**Refreshes the table-rows. Should be used after sorting or filtering or such.*/
	#refreshTable() {
		//In order to render everything correctly and know which rows should be rendered in the view we need to go from
		//top to bottom because the number of expanded rows above the view might have changed. So go to 
		//#scrollRowIndex 0 to start at top row, also set #scrollY to 0 so the scrollMethod compares the current
		//scrollTop with 0.
		this.#scrollRowIndex=this.#scrollY=0;

		this.#lastCheckedIndex=null;

		//adjust the sizer to what its top and height would be when scrolled all the way up.
		this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height)+parseInt(this.#tableSizer.style.top)+"px";
		this.#tableSizer.style.top=this.#numRenderedRows=0;

		//its position and size needs to be udated.Hide for now and let #updateRowValues or #renderExpansion add it back
		this.#cellCursor.style.display="none";

		this.#mainTbody.replaceChildren();//remove all the tr-elements
		this.#maybeAddTrs();//add them again and with their correct data, at least based on them being the top rows 
		this.#scrollMethod();//now scroll back to the real scroll-position
	}

	/**This onScroll-handler is used when rows are of static height and can't be expanded either.
	 * It is the fastest scroll-method since row-heights are known and it is easy to calculate which rows should be
	 * rendered even when scrolling more than a whole page at once as each row won't have to be iterated, and rows
	 * will only have to be created or deleted if the table is resized so the same tr-elements are reused.* 
	 * @returns */
	#onScrollStaticRowHeightNoExpansion() {
		const scrY=Math.max(this.#scrollBody.scrollTop-this.#scrollMarginPx,0);
		const newScrollRowIndex=Math.min(parseInt(scrY/this.#rowHeight),this.#data.length-this.#mainTbody.rows.length);
		
		if (newScrollRowIndex==this.#scrollRowIndex)
			return;
		if(Math.abs(newScrollRowIndex-this.#scrollRowIndex)>this.#mainTbody.rows.length){//if scrolling by whole page(s)
			this.#scrollRowIndex=parseInt(scrY/this.#rowHeight);
			this.#refreshTable();
		} else {
			const scrollSignum=Math.sign(newScrollRowIndex-this.#scrollRowIndex);//1 if moving down, -1 if up
			do {
				this.#scrollRowIndex+=scrollSignum;
				if (scrollSignum==1) {//moving down												move top row to bottom
					const dataIndex=this.#scrollRowIndex+this.#numRenderedRows-1;
					this.#updateRowValues(this.#mainTbody.appendChild(this.#mainTbody.firstChild),dataIndex);
				} else {//moving up
					let trToMove=this.#mainTbody.lastChild;									//move bottom row to top
					this.#mainTbody.prepend(trToMove);
					this.#updateRowValues(trToMove,this.#scrollRowIndex);
				}
			} while (this.#scrollRowIndex!=newScrollRowIndex);
		}
		this.#refreshTableSizerNoExpansions();
	}

	#onScrollStaticRowHeightExpansion(e) {
		const newScrY=Math.max(this.#scrollBody.scrollTop-this.#scrollMarginPx,0);
		if (newScrY>parseInt(this.#scrollY)) {//if scrolling down
			while (newScrY-parseInt(this.#tableSizer.style.top)
			>(this.#rowMetaGet(this.#scrollRowIndex)?.h??this.#rowHeight)) {//if a whole top row is outside
				if (this.#scrollRowIndex+this.#numRenderedRows>this.#data.length-1)
					break;
				let topShift;//height of the row that is at the top before scroll and which will be removed which is the
																	// amount of pixels the whole table is shiftet by
				//check if the top row (the one that is to be moved to the bottom) is expanded
				if (topShift=this.#rowMetaGet(this.#scrollRowIndex)?.h) {
					delete this.#openExpansions[this.#scrollRowIndex];
					this.#mainTbody.rows[1].remove();
				} else
					topShift=this.#rowHeight;
				const dataIndex=this.#numRenderedRows+this.#scrollRowIndex;//the data-index of the new row
				this.#scrollRowIndex++;

				//move the top row to bottom and update its values
				const trToMove=this.#updateRowValues(this.#mainTbody.appendChild(this.#mainTbody.firstChild),dataIndex);

				//move the table down by the height of the removed row to compensate,else the whole table would shift up

				this.#doRowScrollExp(trToMove,dataIndex,this.#scrollRowIndex,-topShift);
			}
		} else if (newScrY<parseInt(this.#scrollY)) {//if scrolling up
			while (newScrY<parseInt(this.#tableSizer.style.top)) {//while top row is below top of viewport
				this.#scrollRowIndex--;

				//check if the bottom row (the one that is to be moved to the top) is expanded
				if (this.#rowMetaGet(this.#scrollRowIndex+this.#numRenderedRows)?.h) {
					delete this.#openExpansions[this.#scrollRowIndex+this.#numRenderedRows];
					this.#mainTbody.lastChild.remove();//remove the expansion-tr
				}

				let trToMove=this.#mainTbody.lastChild;									//move bottom row to top
				this.#mainTbody.prepend(trToMove);
				this.#updateRowValues(trToMove,this.#scrollRowIndex);//the data of the new row;

				//height of the row that is added at the top which is amount of pixels the whole table is shiftet by
				const topShift=this.#rowMetaGet(this.#scrollRowIndex)?.h??this.#rowHeight;

				this.#doRowScrollExp(trToMove,this.#scrollRowIndex,this.#scrollRowIndex+this.#numRenderedRows,topShift);
			}
		}
		this.#scrollY=newScrY;
	}

	/**Used by #onScrollStaticRowHeightExpansion whenever a row is actually added/removed(or rather moved)*/
	#doRowScrollExp(trToMove,newMainIndex,oldMainIndex,topShift) {
		const expansionHeight=this.#rowMetaGet(newMainIndex)?.h;
		if (expansionHeight>0) {
			this.#renderExpansion(trToMove,newMainIndex);
		} else if (expansionHeight==-1) {
			this.#scrollBody.scrollTop+=this.#expandRow(trToMove,false);
		} else
			trToMove.classList.remove("expanded");
		
		this.#tableSizer.style.height=parseInt(this.#tableSizer.style.height)+topShift+"px";
		this.#tableSizer.style.top=parseInt(this.#tableSizer.style.top)-topShift+"px";

		if (oldMainIndex===this.#mainRowIndex)//cell-cursor is on moved row
			this.#selectedCell=null;

		this.#lookForActiveCellInRow(trToMove);//look for active cell (cellcursor) in the row. This is needed
		//in order to reassign the dom-element and such and also adjust the pos of the cellcursor in case
		//the pos of the cell is not the same due to sorting/filtering
	}
	

	/**This should be called on each row that is being scrolled into view that might hold the active cell in order
	 * to set #selectedCell to the correct element
	 * @param {HTMLTableRowElement} tr */
	#lookForActiveCellInRow(tr) {
		if (tr.dataset.dataRowIndex==this.#mainRowIndex) {
			if (!this.#activeExpCell)
				this.#selectedCell=tr.cells[this.#mainColIndex];
			else {//if inside expansion
				//generate the path to the cellObject in #activeExpansionCell by stepping through its parents to root
				let path=[];
				for (let cellObject=this.#activeExpCell; cellObject.parent; cellObject=cellObject.parent)
					path.unshift(cellObject.index);
				//now follow the same path in the new #openExpansionNavMap[rowIndex], eg the cellObjects..
				let cellObject=this.#openExpansions[this.#mainRowIndex];
				for (let step of path)
					cellObject=cellObject.children[step];
				this.#selectedCell=cellObject.el;
				this.#activeExpCell=cellObject;//should be identical but this allows for the old one to be gc'd
			}
			this.#adjustCursorPosSize(this.#selectedCell);
		}
	}

	#refreshTableSizerNoExpansions() {	
		this.#tableSizer.style.top=this.#scrollRowIndex*this.#rowHeight+"px";
		this.#tableSizer.style.height=(this.#data.length-this.#scrollRowIndex)*this.#rowHeight+"px";
	}

	#createExpandContractButton() {
		const a=document.createElement("a");
		a.appendChild(document.createElement("span"));
		return a;
	}

	#createCheckbox(preventClickSelect) {
		const checkbox=document.createElement("input");
		checkbox.type="checkbox";
		checkbox.tabIndex="-1";

		if (preventClickSelect)//prevent checking and leave to #toggleRowSelected for consistant behavior when 
			checkbox.addEventListener("click",this.#preventDefault);//clicking checkbox vs clicking its cell

		//prevent gaining focus when clicking it. Otherwise it does gain focus despite tabIndex -1
		checkbox.addEventListener("mousedown",this.#preventDefault);

		return checkbox;
	}

	/**Should be called if tr-elements might need to be created which is when data is added or if table grows*/
	#maybeAddTrs() {
		let lastTr=this.#mainTbody.lastChild;
		const scrH=this.#scrollBody.offsetHeight+this.#scrollMarginPx*2;
		const dataLen=this.#data.length;
		//if there are fewer trs than datarows, and if there is empty space below bottom tr
		while ((this.#numRenderedRows-1)*this.#rowHeight<scrH&&this.#scrollRowIndex+this.#numRenderedRows<dataLen) {
			lastTr=this.#mainTable.insertRow();
			this.#numRenderedRows++;
			for (let i=0; i<this.#colStructs.length; i++) {
				const cell=lastTr.insertCell();
				const div=cell.appendChild(document.createElement("div"));//used to set height of cells
				div.style.height=this.#rowInnerHeight||"auto";				
				if (this.#colStructs[i].type==="expand") {
					div.appendChild(this.#createExpandContractButton());
					cell.classList.add("expand-col");
				} else if (this.#colStructs[i].type==="select") {
					div.appendChild(this.#createCheckbox(true));
					cell.classList.add("select-col");
				}
			}
			this.#updateRowValues(lastTr,this.#scrollRowIndex+this.#numRenderedRows-1);
			if (this.#rowMetaGet(this.#scrollRowIndex+this.#numRenderedRows-1)?.h)
				this.#renderExpansion(lastTr,this.#scrollRowIndex+this.#numRenderedRows-1);
			this.#lookForActiveCellInRow(lastTr);//look for active cell (cellcursor) in the row
			if (!this.#rowHeight) {//if there were no rows prior to this
				this.#rowHeight=lastTr.offsetHeight+this.#borderSpacingY;
				const tdComputedStyle=window.getComputedStyle(lastTr.firstChild);
				for (let prop of ["paddingTop","paddingBottom","borderBottomWidth","borderTopWidth"])
					this.#rowInnerHeight-=parseInt(tdComputedStyle[prop]);
				this.#rowInnerHeight=this.#rowInnerHeight+lastTr.offsetHeight+"px";
			}
		}
	}

	#preventDefault(e){
		e.preventDefault();
	}

	/**Should be called if tr-elements might need to be removed which is when table shrinks*/
	#maybeRemoveTrs() {
		const scrH=this.#scrollBody.offsetHeight+this.#scrollMarginPx*2;
		while ((this.#numRenderedRows-2)*this.#rowHeight>scrH) {
			if (this.#rowMetaGet(this.#scrollRowIndex+this.#numRenderedRows-1)?.h) {
				this.#mainTbody.lastChild.remove();
				delete this.#openExpansions[this.#scrollRowIndex+this.#numRenderedRows];
			}
			this.#mainTbody.lastChild.remove();
			this.#numRenderedRows--;
		}
	}

	/**Update the values of a row in the table. The tr needs to be passed in as well as the index of the data in #data
	 * The row needs to already have the right amount of td's.
	 * @param {HTMLTableRowElement} tr The tr-element whose cells that should be updated*/
	#updateRowValues(tr,mainIndex) {
		tr.dataset.dataRowIndex=mainIndex;
		const selected=this.#selectedRows.indexOf(this.#data[mainIndex])!=-1;
		tr.classList.toggle("selected",!!selected);
		for (let colI=0; colI<this.#colStructs.length; colI++) {
			let td=tr.cells[colI];
			let colStruct=this.#colStructs[colI];
			if (colStruct.type!="expand"&&colStruct.type!="select")
				this.#updateMainRowCell(td,colStruct);
			else if (colStruct.type=="select")
				td.querySelector("input").checked=selected;
		}
		if (this.#highlightRowsOnView[mainIndex]) {
			delete this.#highlightRowsOnView[mainIndex];
			this.#highlightRowIndex(mainIndex);
		}
		return tr;
	}

	/**
	 * Format bytes as human-readable text.
	 * 
	 * @param bytes Number of bytes.
	 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
	 *           binary (IEC), aka powers of 1024.
	 * @param dp Number of decimal places to display.
	 * 
	 * @return Formatted string.
	 */
	#humanFileSize(bytes, si=false, dp=1) {
		const thresh = si ? 1000 : 1024;
	
		if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
		}
	
		const units = si 
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
		let u = -1;
		const r = 10**dp;
	
		do {
		bytes /= thresh;
		++u;
		} while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
	
	
		return bytes.toFixed(dp) + ' ' + units[u];
	}

	#generateFileCell(fileCellObj,cellEl,rowData,dataIndex) {
		const fileStruct=fileCellObj.struct;//struct of cellObj will get overwritten. Save reference here.
		fileCellObj.fileInputStruct=fileStruct;//saving this ref here which is used to revert with if user deletes file

		//define all the file-meta-props
		const lang=this.#opts.lang??{};
		let metaEntries=[{type:"field",title:lang.fileName??"Filename",id:"name"},
			{type:"field",title:lang.fileLastModified??"Last Modified",id:"lastModified",render:dataRow=>
			new Date(dataRow.lastModified).toISOString().slice(0, 16).replace('T', ' ')},
			{type:"field",title:lang.fileSize??"Size",id:"size",render:dataRow=>this.#humanFileSize(dataRow.size)},
			{type:"field",title:lang.fileType??"Type",id:"type"}];
		for (let metaI=-1,metaName; metaName=["filename","lastModified","size","type"][++metaI];)
			if(!(fileStruct.input.fileMetasToShow?.[metaName]??this.#opts.defaultFileMetasToShow?.[metaName]??true))
				metaEntries.splice(metaI,1);//potentially remove (some of) them
		//define the group-structure for the file
		
		const fileGroup=this.#getGroupStructCopyWithDeleteControls({type:"group",entries:[]});
		fileGroup.entries[0].entries.unshift({type:"field",input:{type:"button",btnText:"Open"
				,clickHandler:(e,file,mainIndex,struct,btnObj)=>{
					rowData??=this.#data[mainIndex];
					fileStruct.input.openHandler?.(e,file,fileStruct,fileCellObj.dataObj,mainIndex,btnObj);
			}},
		});
		fileGroup.entries.push({type:"collection",entries:metaEntries});
		
		const fileData=rowData[fileCellObj.struct.id];
		this.#generateExpansionContent(fileGroup,dataIndex,fileCellObj,cellEl,fileCellObj.path,fileData);
		const fileMeta=this.#mapGet(this.#filesMeta,fileData);
		if (fileMeta!=null) {
			const progressbarOuter=cellEl.appendChild(document.createElement("div"));
			progressbarOuter.classList.add("progressbar","active");
			const progressbarInner=progressbarOuter.appendChild(document.createElement("div"));
			progressbarInner.style.transition="none";//get to the current pos immediately in case running from before
			fileMeta.bars.push(progressbarInner);
			progressbarInner.role="progressbar";
			const progressSpan=progressbarInner.appendChild(document.createElement("span"));
			progressbarInner.style.width=progressSpan.innerText=parseInt(fileMeta.uploadedBytes/fileData.size*100)+"%";
			progressbarInner.style.removeProperty("transition");//enable transitioning again, it was disabled above
		}
	}


	/**Updates the html-element of a cell inside an expansion. Also updates nonEmptyDescentants of the cell-object of 
	 * 	group-rows as well as toggling the empty-class of them. Reports back whether visibility has been changed.
	 * @param {*} cellObj */
	#updateExpansionCell(cellObj,rowData) {
		let cellEl=cellObj.el;
		if (cellObj.struct.maxHeight) {//if there's a maxHeight stated, which is used for textareas
			cellEl.innerHTML="";//empty the cell, otherwise multiple calls to this would add more and more content to it
			cellEl=cellEl.appendChild(document.createElement("div"));//then put a div inside and change cellEl to that
			cellEl.style.maxHeight=cellObj.struct.maxHeight;//then set its maxHeight
			cellEl.style.overflow="auto";//and male it scrollable
			//can't make td directly scrollable which is why the div is needed
		}
		for (var rootCell=cellObj;rootCell.parent;rootCell=rootCell.parent);
		const oldCellContent=cellEl.innerText;
		if (cellObj.struct.input?.type=="file"&&rowData[cellObj.struct.id]) {
			this.#generateFileCell(cellObj,cellEl,rowData,rootCell.rowIndex);
		} else {
			this.#updateCell(cellObj.struct,cellEl,cellObj.selEl,rowData,rootCell.rowIndex,cellObj);
			if (cellObj.struct.input?.type!=="button") {
				const newCellContent=cellEl.innerText;
				if (!newCellContent!=!oldCellContent) {
					for (let cellI=cellObj; cellI; cellI=cellI.parent)
						if (cellI.nonEmptyDescentants!=null)
							cellI.grpTr.classList.toggle("empty",!(cellI.nonEmptyDescentants+=newCellContent?1:-1));
					return true;
				}
			} else
				cellObj.el=cellObj.selEl=cellObj.el.querySelector("button");
		}
	}

	#updateCell(struct,el,selEl,rowData,mainIndex,cellObj=null) {
		if (struct.input?.type==="button") {
			this.#generateButton(struct,mainIndex,el,rowData,cellObj);
		} else {
			let newCellContent;
			if (struct.render)
				newCellContent=struct.render(rowData,struct,mainIndex);
			else if (struct.input?.type==="select") {
				let selOptObj=rowData[struct.id];
				if (selOptObj&&typeof selOptObj!=="object")
					selOptObj=struct.input.options.find(opt=>opt.value==rowData[struct.id]);
				newCellContent=selOptObj?.text??"";
			} else
				newCellContent=rowData[struct.id]??"";
			let isDisabled=false;
			if (this.#spreadsheet&&struct.type!=="expand") {
				const enabledFuncResult=struct.input?.enabled?.(struct,rowData,mainIndex,cellObj);
				if (!struct.input||enabledFuncResult==false||enabledFuncResult?.enabled==false)
					isDisabled=true;
			}
			(selEl??el).classList.toggle("disabled",isDisabled);
			el.innerText=newCellContent;
		}
	}

	/**Updates the html-element of a main-table-cell
	 * @param {*} cellEl 
	 * @param {*} colStruct */
	#updateMainRowCell(cellEl,colStruct) {
		cellEl.firstChild.innerHTML="";
		const mainIndex=cellEl.closest(".main-table>tbody>tr").dataset.dataRowIndex;
		this.#updateCell(colStruct,cellEl.firstChild,cellEl,this.#data[mainIndex],mainIndex);
	}

	scrollToDataRow(dataRow,highlight=true) {
		let scrollY=0;
		for (let i=-1,otherDataRow;otherDataRow=this.#data[++i];) {
			if (otherDataRow==dataRow) {
				scrollY=scrollY-this.#scrollBody.offsetHeight/2+this.#rowHeight;
				this.#scrollBody.scrollTo({top:scrollY,behavior:'smooth'});
				if (highlight)
					this.#highlightRowIndex(i);
				return;
			}
			scrollY+=this.#rowMetaGet(i)?.h??this.#rowHeight;
		}
	}

	#highlightRowIndex(index) {
		const tr=this.#mainTbody.querySelector(`[data-data-row-index="${index}"]`);
		if (tr)
			this.#highlightElements(tr.children);
		else
			this.#highlightRowsOnView[index]=true;
	}

	/**Change or add any data in the table
	 * @param {int|object} dataRow_or_mainIndex Either the actual data-object that should be updated, or its index in
	 * 											the current view
	 * @param {string|string[]} dataPath The path to the data-value that should be updated or added to. For a value in
	 * 				the base which is not nested within repeated-containers it should simplt be the key of the property.
	 * 				It can either be a string of keys separated by dots(.) or a array where each element is a key.
	 * 				For repeated-arrays which data should be added to "[]" can be used similiar to how it's done in PHP.
	 * 				For instance the path could be "foo[]" or "foo[].bar". Objects/arrays will be created recursively
	 * 				if they don't yet exist.
	 * @param {*} data The actual data to be replaced with or added
	 * @param {bool} scrollTo Whether the modified/added data should be scrolled to and highlighted.
	 * @returns The tablance-object, for chaining*/
	updateData(dataRow_or_mainIndex,dataPath,data,scrollTo) {
		let dataRow,mainIndx,updatedEl,path=[];
		if (typeof dataRow_or_mainIndex=="number")
			dataRow=this.#data[mainIndx=dataRow_or_mainIndex];
		else //if (typeof dataRow_or_mainIndex=="object")
			mainIndx=this.#data.indexOf(dataRow=dataRow_or_mainIndex);
		const pathArr=typeof dataPath=="string"?dataPath.split(/\.|(?=\[\])/):dataPath;
		let celObj=this.#openExpansions[mainIndx],celData=dataRow;
		for (let i=-1,dataStep,dataPortion=dataRow; dataStep=pathArr[++i];) {
			if (i<pathArr.length-1) {//if not at last step yet meaning this is a container
				if (!dataPortion[dataStep])//the container doesn't exist
					dataPortion=dataPortion[dataStep=="[]"?dataPortion.length:dataStep]
											=(isNaN(pathArr[i+1])&&pathArr[i+1]!=="[]")?{}:[];//then create it
				else
					dataPortion=dataPortion[dataStep];
			} else//at last step
				dataPortion[dataStep=="[]"?dataPortion.length:dataStep]=data;
			if (celObj) {
				const childCel=findCelRecursive(celObj,dataPortion,dataStep,path);
				if (childCel) {
					celData=dataPortion;
					celObj=childCel;
				}
			}
		}
		if (celObj) {
			switch (celObj.struct.type) {
				case "field":
					this.#updateExpansionCell(celObj,celData);
				break; case "repeated":
					updatedEl=this.#insertRepeatData(celObj,celData[celData.length-1],mainIndx,path);
			}
			if (scrollTo) {
				newEl.scrollIntoView({behavior:'smooth',block:"center"});
				this.#highlightElements([updatedEl,...updatedEl.getElementsByTagName('*')]);
			}
			this.#adjustCursorPosSize(this.#selectedCell,true);
		} else {
			if (mainIndx>=this.#scrollRowIndex&&mainIndx<this.#scrollRowIndex+this.#numRenderedRows) {
				const tr=this.#mainTbody.querySelector(`[data-data-row-index="${mainIndx}"]:not(.expansion)`);
				for (let i=-1,colStruct;colStruct=this.#colStructs[++i];)
					if (colStruct.id==dataPath)
						return this.#updateMainRowCell(tr.cells[i],colStruct);
				if (!celObj)
					return;
			}
			if (scrollTo)
				scrollToDataRow(dataRow,true);
		}
		return this;

		function findCelRecursive(celObj,dataPortion,dataStep,path) {
			if (celObj.children)
				for (let child,childI=-1; child=celObj.children[++childI];) {
					path.push(childI);
					if (child.struct.id==dataStep)
						return child;
					if (child.struct.type=="repeated"&&child.dataObj==dataPortion) {
						path.push(child.index);
						return child;
					}
					if (child.struct.type=="group"||child.struct.type=="list") {
						const cel=findCelRecursive(child,dataPortion,dataStep,path);
						if (cel)
							return cel;
					}
					path.pop();
				}
		}
	}

	#insertRepeatData(rptCel,data,mainIndex,path) {
		const nextSiblingObj=findClosestRenderedSibling(rptCel);
		let nextSibl;
		if (nextSiblingObj)
			nextSibl=(nextSiblingObj.el??nextSiblingObj.listTable).parentElement;//next sibling/element to insert before
		let parentContainerEl=(rptCel.parent.listTable??rptCel.parent.el).firstChild;
		if (rptCel.parent.struct.type=="list")
			nextSibl=nextSibl?.parentElement;
		if (rptCel.struct.sortCompare) {
			const sortedRowData=[...rptCel.dataObj].sort(rptCel.struct.sortCompare);
			for (var indx=sortedRowData.length-1;sortedRowData[indx]!=data;indx--)
				nextSibl=nextSibl.previousSibling;
		}
		
		return this.#generateListItem(parentContainerEl,rptCel.struct.entry,mainIndex,rptCel,path,data,nextSibl,indx);
		function findClosestRenderedSibling(startCell) {
			for (let i=startCell.index,otherCell; otherCell=startCell.parent.children[++i];) {
				if (otherCell.el||otherCell.listTable)
					return otherCell;
				if (otherCell.children) {
					const lastRenderedChild=findClosestRenderedSibling(otherCell.children[0]);
					if (lastRenderedChild)
						return lastRenderedChild;
				}
			}	
		}
	}

	#highlightElements(elements) {
		const origColors=[];
		for (const el of elements) {
			origColors.push(window.getComputedStyle(el).backgroundColor);
			el.style.transition = "none";
			el.style.backgroundColor="blue";
		}
		setTimeout(()=>{
			for (const el of elements) {
				el.style.transition="background-color 1s linear";
				el.style.backgroundColor=origColors.shift();
			}
		});
	}
}