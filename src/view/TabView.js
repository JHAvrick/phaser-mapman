//TabView restricts update of data across multiple tabs to the active tab only, saving some performance power
class TabView {
	constructor(tabsSelector){
		this.events = new EventManager();
		this.tabs = {};
		this.tabsSelector = tabsSelector;
		this.activeTab = undefined;
		this.tabIndex = 0;

		$("#"+tabsSelector).tabs({
			activate: (event, ui) => {
				this.activeTab = this.getTabByIndex(ui.newTab.index());
				this.events.trigger('tabSwitched', this.activeTab);
			}
		});
	}

	addTab(name, tabObject){
		this.tabs[name] = tabObject;
		this.tabs[name].tabNumber = this.tabIndex++;
	}

	openTab(name){
		$("#property-tabs").tabs( "option", "active", this.tabs[name].tabNumber );
		this.activeTab =  this.tabs[name];
		this.activeTab.refresh();
	}

	disableTabs(names){
		for (var i = 0; i < names.length ; i++){
			this.disableTab(names[i]);
		}
	}

	disableTab(name){
		$("#property-tabs").tabs( "option", "disable", this.tabs[name].tabNumber );
	}

	enableTab(){
		$("#property-tabs").tabs( "option", "enable", this.tabs[name].tabNumber );
	}

	enableTabs(){
		for (var i = 0; i < names.length ; i++){
			this.enableTab(names[i]);
		}
	}

	setActive(name){
		this.activeTab = this.tabs[name];
	}

	getTabByIndex(index){
		for (var tab in this.tabs){
			if (this.tabs[tab].tabNumber == index){
				return this.tabs[tab];
			}
		}
	}

	triggerActive(event, param){
		if (this.activeTab[event]){
			this.activeTab[event](param);
		}
	}

}

module.exports = TabView;
