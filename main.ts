import { Component, MarkdownRenderer, Notice, Plugin, setIcon, TFile } from 'obsidian';

export default class CacheNotes extends Plugin {
	private enabled: boolean = false
	private status: HTMLElement
	private button: HTMLElement
	private cache: {[key: string]: string}

	async onload() {
		this.status = this.addStatusBarItem()
		this.button = this.addRibbonIcon(this.enabled ? 'database-zap' : 'database', 'Cache Notes', (e) => {this.setCaching(!this.enabled)})

		this.registerEvent(this.app.metadataCache.on("changed", (e) => {
			this.cacheFile(e)
		}))

		this.addCommand({id: 'cache-notes-enable', name: 'Cache Notes: Enable', callback: () => {this.setCaching(true)}})
		this.addCommand({id: 'cache-notes-disable', name: 'Cache Notes: Disable', callback: () => {this.setCaching(false)}})

		// @ts-ignore
		window.CacheNotes = this

		this.setCaching(true)
	}

	onunload() {
		this.setCaching(false)
	}

	private setCaching = (enabled: boolean) => {
		if(this.enabled == enabled) return
		
		this.status.setText(enabled ? 'Caching notes' : "")
		setIcon(this.button, enabled ? 'database-zap' : 'database')
		new Notice(enabled ? 'Note caching enabled' : 'Note caching disabled')

		this.cache = {}

		this.enabled = enabled
	}

	public cacheFile = (file: TFile) => {
		if(!this.enabled) return
		this.app.vault.read(file).then((content) => {
			const el = createDiv()
			const container = new Component()
			container.load()
			MarkdownRenderer.render(this.app, content, el, file.path, container).then(() => {
				const html = el.innerHTML
				container.unload()
				this.cache[file.path] = html
			})
		}).catch((error) => {
			new Notice("Error caching file " + file.name + '.')
		})
	}

	public get = (path: string) => {
		return this.cache[path]
	}
}