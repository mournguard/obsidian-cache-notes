import { registerAPI } from '@vanakat/plugin-api'
import { Component, MarkdownRenderer, Notice, Plugin, setIcon } from 'obsidian'

export default class CacheNotes extends Plugin {
	private enabled: boolean = false
	private status: HTMLElement
	private button: HTMLElement
	private cache: {[key: string]: string}

	async onload() {
		this.app.workspace.onLayoutReady(this.init)
	}

	onunload() {
		this.setCaching(false)
		this.clearCache()
	}

	private init = () => {
		registerAPI("Cache Notes", this, this)
		
		this.status = this.addStatusBarItem()
		this.button = this.addRibbonIcon(this.enabled ? 'database-zap' : 'database', 'Cache Notes', (e) => this.setCaching(!this.enabled))

		this.registerEvent(this.app.metadataCache.on("changed", (e) => {
			this.cacheFile(e.path)
		}))

		this.addCommand({id: 'cache-notes-enable', name: 'Enable', callback: () => this.setCaching(true)})
		this.addCommand({id: 'cache-notes-disable', name: 'Disable', callback: () => this.setCaching(false)})

		this.setCaching(true)
	}

	private setCaching = (enabled: boolean) => {
		if(this.enabled == enabled) return
		
		setIcon(this.button, enabled ? 'database-zap' : 'database')
		new Notice(enabled ? 'Cache Notes: Caching enabled' : 'Cache Notes: Caching disabled')

		this.clearCache()

		this.enabled = enabled
	}

	public cacheFile = async (filepath: string) => {
		return new Promise((resolve, reject) => {
			if (!this.enabled) return reject("Caching Disabled")
			let file = this.app.vault.getFileByPath(filepath)
			if (!file) return reject("File not Found")
			this.status.setText("Caching note : " + filepath)
			this.app.vault.cachedRead(file).then((content) => {
				const el = createDiv()
				const container = new Component()
				container.load()
				MarkdownRenderer.render(this.app, content, el, file.path, container).then(() => {
					const html = el.innerHTML
					container.unload()
					this.cache[file.path] = html
					this.status.setText("")
					return resolve(this.cache[file.path])
				})
			}).catch(() => {
				new Notice("Cache Notes: Error caching file " + file.name + '.')
				this.status.setText("")
				return reject("Cannot Read File")
			})
		})
	}

	public get = (path: string) => {
		return this.cache[path]
	}

	public clearCache = () => {
		this.cache = {}
	}
}