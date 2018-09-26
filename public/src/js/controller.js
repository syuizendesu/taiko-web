class Controller{
	constructor(selectedSong, songData, autoPlayEnabled, multiplayer){
		this.selectedSong = selectedSong
		this.songData = songData
		this.autoPlayEnabled = autoPlayEnabled
		this.multiplayer = multiplayer
		
		var backgroundURL = "/songs/" + this.selectedSong.folder + "/bg.png"
		var songParser = new ParseSong(songData)
		this.parsedSongData = songParser.getData()
		
		assets.songs.forEach(song => {
			if(song.id == this.selectedSong.folder){
				this.mainAsset = song.sound
			}
		})
		
		this.game = new Game(this, this.selectedSong, this.parsedSongData)
		this.view = new View(this, backgroundURL, this.selectedSong.title, this.selectedSong.difficulty)
		this.mekadon = new Mekadon(this, this.game)
		this.keyboard = new Keyboard(this)
	}
	run(syncWith){
		this.loadUIEvents()
		this.game.run()
		this.view.run()
		this.startMainLoop()
		if(syncWith){
			syncWith.game.getElapsedTime = () => {
				return this.game.elapsedTime
			}
			this.game.setElapsedTime =
			syncWith.game.setElapsedTime = time => {
				this.game.elapsedTime.ms = time
				syncWith.game.elapsedTime.ms = time
			}
			syncWith.run()
			this.syncWith = syncWith
		}
	}
	loadUIEvents(){
		this.continueBtn = document.getElementById("continue-butt")
		this.restartBtn = document.getElementById("restart-butt")
		this.songSelBtn = document.getElementById("song-selection-butt")
		pageEvents.add(this.continueBtn, "click", () => {
			this.togglePauseMenu()
		})
		pageEvents.add(this.restartBtn, "click", () => {
			assets.sounds["don"].play()
			this.restartSong()
		})
		pageEvents.add(this.songSelBtn, "click", () => {
			assets.sounds["don"].play()
			this.songSelection()
		})
	}
	startMainLoop(){
		this.mainLoopStarted = false
		this.mainLoopRunning = true
		this.mainLoop()
	}
	stopMainLoop(){
		this.mainLoopRunning = false
		this.mainAsset.stop()
		if(this.syncWith){
			this.syncWith.stopMainLoop()
		}
	}
	mainLoop(){
		if(this.mainLoopRunning){
			if(this.multiplayer !== 2){
				requestAnimationFrame(() => {
					if(this.syncWith){
						this.syncWith.game.elapsedTime.ms = this.game.elapsedTime.ms
					}
					this.mainLoop()
					if(this.syncWith){
						this.syncWith.mainLoop()
					}
				})
			}
			var ms = this.game.getElapsedTime().ms
			
			if(!this.game.isPaused()){
				this.keyboard.checkGameKeys()
				
				if(ms >= 0 && !this.mainLoopStarted){
					this.mainLoopStarted = true
				}
				if(ms < 0){
					this.game.updateTime()
				}
				if(this.mainLoopStarted){
					this.game.update()
					if(!this.mainLoopRunning){
						return
					}
					this.game.playMainMusic()
				}
				this.view.refresh()
			}
			this.keyboard.checkMenuKeys()
		}
	}
	togglePauseMenu(){
		this.togglePause()
		this.view.togglePauseMenu()
	}
	gameEnded(){
		this.view.gameEnded()
		var score = this.getGlobalScore()
		var vp
		if(score.fail === 0){
			vp = "fullcombo"
			this.playSoundMeka("fullcombo", 1.350)
		}else if(score.hp >= 50){
			vp = "clear"
		}else{
			vp = "fail"
		}
		assets.sounds["game" + vp].play()
	}
	displayResults(){
		this.clean()
		if(this.multiplayer !== 2){
			new Scoresheet(this, this.getGlobalScore(), this.multiplayer)
		}
	}
	displayScore(score, notPlayed){
		this.view.displayScore(score, notPlayed)
	}
	songSelection(){
		this.clean()
		new SongSelect()
	}
	restartSong(){
		this.clean()
		if(this.multiplayer){
			new loadSong(this.selectedSong, false, true)
		}else{
			loader.changePage("game")
			var taikoGame = new Controller(this.selectedSong, this.songData, this.autoPlayEnabled)
			taikoGame.run()
		}
	}
	playSoundMeka(soundID, time){
		var meka = ""
		if(this.autoPlayEnabled && !this.multiplayer){
			meka = "-meka"
		}
		assets.sounds[soundID + meka].play(time)
	}
	togglePause(){
		if(this.syncWith){
			this.syncWith.game.togglePause()
		}
		this.game.togglePause()
	}
	getKeys(){
		return this.keyboard.getKeys()
	}
	setKey(keyCode, down, ms){
		return this.keyboard.setKey(keyCode, down, ms)
	}
	getBindings(){
		return this.keyboard.getBindings()
	}
	getSongData(){
		return this.game.getSongData()
	}
	getElapsedTime(){
		return this.game.getElapsedTime()
	}
	getCircles(){
		return this.game.getCircles()
	}
	getCurrentCircle(){
		return this.game.getCurrentCircle()
	}
	isWaiting(key, type){
		return this.keyboard.isWaiting(key, type)
	}
	waitForKeyup(key, type){
		this.keyboard.waitForKeyup(key, type)
	}
	getKeyTime(){
		return this.keyboard.getKeyTime()
	}
	getCombo(){
		return this.game.getCombo()
	}
	getGlobalScore(){
		return this.game.getGlobalScore()
	}
	autoPlay(circle){
		if(this.multiplayer){
			p2.play(circle, this.mekadon)
		}else{
			this.mekadon.play(circle)
		}
	}
	clean(){
		this.stopMainLoop()
		this.keyboard.clean()
		this.view.clean()
		
		pageEvents.remove(this.continueBtn, "click")
		delete this.continueBtn
		pageEvents.remove(this.restartBtn, "click")
		delete this.restartBtn
		pageEvents.remove(this.songSelBtn, "click")
		delete this.songSelBtn
	}
}
