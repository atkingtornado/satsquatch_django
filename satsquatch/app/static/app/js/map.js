$(document).ready(function(){

	L_PREFER_CANVAS=true;
	var num_times = 15
	var preload_finished = false
	var preload_ongoing = false

	function createCookie(name,value,days) {
	    var expires = "";
	    if (days) {
	        var date = new Date();
	        date.setTime(date.getTime() + (days*24*60*60*1000));
	        expires = "; expires=" + date.toUTCString();
	    }
	    document.cookie = name + "=" + value + expires + "; path=/";
	}

	function readCookie(name) {
	    var nameEQ = name + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0;i < ca.length;i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1,c.length);
	        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	    }
	    return null;
	}

	function downloadCanvas(link, canvasId, filename) {
	    link.href = document.getElementById(canvasId).toDataURL();
	    link.download = filename;
	}
	function sortLayers(){
		var num_layers = Object.keys(all_layers).length
		var layer_index = num_layers+1
		$('#layer-list li').each(function(){
			var layer_id = this.id.replace('_order','')
			all_layers[layer_id].setZIndex(layer_index)
			layer_index-=1;
		})
	}
	function takeScreenshot(){
		toggleUI()
		refreshLayers()
		$('#img-container').fadeIn('fast')
		$('#screenshot').hide()
		var opts = {
		  lines: 9 // The number of lines to draw
		, length: 43 // The length of each line
		, width: 15 // The line thickness
		, radius: 39 // The radius of the inner circle
		, scale: 0.75 // Scales overall size of the spinner
		, corners: 1 // Corner roundness (0..1)
		, color: '#f4f4f4' // #rgb or #rrggbb or array of colors
		, opacity: 0.25 // Opacity of the lines
		, rotate: 0 // The rotation offset
		, direction: 1 // 1: clockwise, -1: counterclockwise
		, speed: 1.1 // Rounds per second
		, trail: 78 // Afterglow percentage
		, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
		, zIndex: 2e9 // The z-index (defaults to 2000000000)
		, className: 'spinner' // The CSS class to assign to the spinner
		, top: '50%' // Top position relative to parent
		, left: '50%' // Left position relative to parent
		, shadow: false // Whether to render a shadow
		, hwaccel: false // Whether to use hardware acceleration
		, position: 'absolute' // Element positioning
		}
		var target = document.getElementById('img-container')
		var spinner = new Spinner(opts).spin(target);


		var layer_opacity  = parseFloat($( "#opacity_" +  active_layer).text().replace('%',''))/100.0 
		layer_opacities=[1.0,layer_opacity, 0.3, 0.5]
		leafletImage(map,layer_opacities, function(err, canvas) {
		    // now you have canvas
		    // example thing to do with that canvas:
		    var img = $('#screenshot');
		    var link = $('#img-link');
		    var dimensions = map.getSize();
		    img.width = dimensions.x;
		    img.height = dimensions.y;
		    dataURL= canvas.toDataURL("image/png");

		    img.attr('src', dataURL);
		    link.attr('href', dataURL);
		    link.attr('download', active_layer+'.png');
		    spinner.stop()
			$('#img-container').append(img);
			$('#screenshot').fadeIn()

		});
	}

	function getLayerTimes(layerid,callback){
		$.ajax({
		    url: 'http://sharp.weather.ou.edu/tbell/' + layerid + '/' + selected_goes_sector + '/' + layerid + '_' + selected_goes_sector + '.json',
		    dataType: 'JSONP',
		    jsonpCallback: 'func',
		    type: 'GET',
		    success: function (data) {

		    	if (num_times > data.times.length){
					num_times = data.times.length
				}

		        all_times  = data.times.sort().slice(data.times.length-num_times, data.times.length)
	            times_length = all_times.length

	            time_slider.options.steps = times_length;
	            time_slider.stepRatios = time_slider.calculateStepRatios();
	            prev_scrub_tick = false

	            if (tile_loop == false){
	            	time_slider.setStep(times_length, 0, snap=false)
	            }


	            callback(all_times)
		    }
		});
	}

	var refresh_interval = false
	function autoRefresh(frequency){
		var frequency_in_ms = frequency * 60.0 * 1000.0
		clearInterval(refresh_interval)
		refresh_interval = setInterval(function(){
			console.log('refresh')
			refreshLayers()
		},frequency_in_ms)
	}

	var refreshing = false
	function refreshLayers(){
		if (active_layer != false){

			if(tile_loop != false){

			}
			else{

			}

			refreshing = true
			getLayerTimes(active_layer,function(all_times){
				active_times = all_times
				var url_date_time = active_times[active_times.length-1]
				var url = 'http://sharp.weather.ou.edu/tbell/' + active_layer + '/' + selected_goes_sector  + '/' + url_date_time + '/{z}/{x}/{-y}.png'
				var layer_opacity  = parseFloat($( "#opacity_" +  active_layer).text().replace('%',''))/100.0 

				removeMapLayer(active_layer)
				addMapLayer(url,prev_layerid,opacity=layer_opacity)
				
				var date_time = url_date_time.split('_')
				date = date_time[0]
                time = date_time[1]

                year = date.substring( 0, 4 )
                month = date.substring( 4, 6 )
                day = date.substring( 6, 8 )
                hh = time.substring( 0, 2 )
                mm = time.substring( 2, 4 )
                ss = time.substring( 4, 6 )

                date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' UTC'


                if (!$('#UTC_toggle').prop('checked')){
                	$('#time').text(date_time_string);
                }
                else{
                	var userdate = new Date(date_time_string);
					timezone = userdate.toString().match(/\(([A-Za-z\s].*)\)/)[1]
					year =  userdate.getFullYear()
	                month = ('0' + (parseInt(userdate.getMonth())+1).toString()).slice(-2)
	                day = userdate.getDate()
					hh = ('0' + userdate.getHours()).slice(-2)
					mm = ('0' + userdate.getMinutes()).slice(-2)
					ss = ('0' + userdate.getSeconds()).slice(-2)

					date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' ' + timezone
					$('#time').text(date_time_string);
                }
			})
		}
	}

	function addLoopLayer(layer, callback) {
		if(preload_ongoing != false){
			layer.on('load',function(){
				// setTimeout(function(){
				// 	map.removeLayer(layer)
				// },100)
				
				callback();
			})	 
			map.addLayer(layer)	
		} 
	}
	var loopTimes = function(arr) {
	    addLoopLayer(arr[x],function(){
	        // set x to next item
	        x++;

	        // any more items in array? continue loop
	        if(x < arr.length ) {
	        	progressCircle.animate(x/arr.length);
	            loopTimes(arr);   
	        }
	        else{
	        	progressCircle.animate(1.0);
	        	preload_finished = true
	        	preload_ongoing = false
	        }
	    }); 
	}
	var x = 0;
	var load_layers = []
	function preLoadLoop(){
		if (active_layer != false){
			preload_ongoing = true
			$('.handle').fadeOut()
			$('#play').hide()
			$('#time_spinner').show()

			for(i=0;i<num_times;i++){
				var url_date_time = active_times[i]

				load_layer = L.tileLayer('http://sharp.weather.ou.edu/tbell/' + active_layer + '/' + selected_goes_sector  + '/' + url_date_time + '/{z}/{x}/{-y}.png',{
					// bounds:bounds,
					reuseTiles : true,
					maxNativeZoom:9
					});
	 			load_layer.setOpacity(0.0); 
	 			load_layer.setZIndex(100)
	 			load_layers.push(load_layer)
			}
			x=0
			loopTimes(load_layers)
		}
		else{
			console.log('no active layers')
		}

	}
	var justPaused = false
	function startLoop(){
		tile_loop = false
		
		if (active_layer != false){
    		$('#time_spinner').hide()
    		$('#pause').show()

    		var layer_opacity  = parseFloat($( "#opacity_" +  active_layer).text().replace('%',''))/100.0 
    		loopndx = 0

    		var tile_loop = setInterval(function(){ 
				if(loopndx == num_times){    				
    				clearInterval(tile_loop)
    				pauseLoop()
    			}
    			else if (loopndx == 0){
    				load_layers[loopndx].setOpacity(100)
    				if(justPaused){
    					load_layers[num_times-1].setOpacity(0)
    				}
    				setTimeDisplay(active_times[loopndx])
    			}
    			else{
    				load_layers[loopndx].setOpacity(100)
    				load_layers[loopndx-1].setOpacity(0)
    				setTimeDisplay(active_times[loopndx])
    			}
    			
    			loopndx+=1
			}, loop_speed);
			
		}
		return tile_loop
	}
	function pauseLoop(){
		justPaused = true
		setTimeout(function(){
			if (tile_loop != false){
				tile_loop = startLoop()
			}
		},1000)

	}
	function stopLoop(loop){
		while(load_layers.length > 0){
            map.removeLayer(load_layers[0])
            load_layers.shift()
        }

        setTimeDisplay(active_times[num_times-1])
		tile_loop = false
		preload_finished = false
		if(loop_move == false){
			$('.handle').fadeIn()
			$('#play').show()
    		$('#pause').hide()
		}
		else{
			$('#time_spinner').show()
			$('#pause').hide()
			$('#play').hide()
		}

    	 clearInterval(loop);
    	return false
	}

	function setTimeDisplay(time){
	   	curr_time = time
        date_time = curr_time.split('_')

        date = date_time[0]
        time = date_time[1]

        year = date.substring( 0, 4 )
        month = date.substring( 4, 6 )
        day = date.substring( 6, 8 )
        hh = time.substring( 0, 2 )
        mm = time.substring( 2, 4 )
        ss = time.substring( 4, 6 )

        date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' UTC'
        if (!$('#UTC_toggle').prop('checked')){
        	
        	$('#time').text(date_time_string);
        }
        else{
        	var userdate = new Date(date_time_string);
			timezone = userdate.toString().match(/\(([A-Za-z\s].*)\)/)[1]
			year =  userdate.getFullYear()
            month = ('0' + (parseInt(userdate.getMonth())+1).toString()).slice(-2)
            day = userdate.getDate()
			hh = ('0' + userdate.getHours()).slice(-2)
			mm = ('0' + userdate.getMinutes()).slice(-2)
			ss = ('0' + userdate.getSeconds()).slice(-2)

			date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' ' + timezone
			$('#time').text(date_time_string);
        }
	}

	var tile_loop = false
	var preload_test = false
    $('#play').on('click',function() {
    	preLoadLoop()
		preload_test = setInterval(function(){ 
			if(preload_finished == true){
				clearInterval(preload_test)
				tile_loop = startLoop()
				progressCircle.animate(0.0);
				preload_finished = false
			}
			else{

			}
		}, 200);
			
    })
    $('#pause').on('click',function() {
    	tile_loop = stopLoop(tile_loop)
	})
	$('#time_spinner').on('click',function() {
		preload_ongoing = false
		clearInterval(preload_test)
		clearInterval(preloading)
		tile_loop = stopLoop(tile_loop)
    	$('#time_spinner').hide()
    	progressCircle.animate(0.0);
	})
    $('.menu-link').on('click touchstart',function() {
    	if(tile_loop != false){
			tile_loop = stopLoop(tile_loop)
			
		}
		if(active_times != false){
			$('#time_spinner').trigger('click')
		}
    	clearInterval(preload_test)
    	clearInterval(preloading)
    	loop_move = false
    	
    })
    $('body').keydown(function(e){
    	key = e.key || e.keyCode || e.which
    	if(key == ' '){
    		if(tile_loop != false){
    			tile_loop = stopLoop(tile_loop)
    		}
    		else{
    			preLoadLoop()
				preload_test = setInterval(function(){ 
					if(preload_finished == true){
						clearInterval(preload_test)
						tile_loop = startLoop()
						preload_finished = false
					}
					else{

					}
				}, 200);
    		}
    	}
    })


	//Function to add layer to map and perform required actions
	function addMapLayer(url,layerid,opacity=1.0,timelayer=false,overlay=false) {
    	curr_layer = L.tileLayer(url,{
			// bounds:bounds,
			reuseTiles : true,
			maxNativeZoom:9
			});

	    if(timelayer == false){

	        curr_layer.on('loading', function(){
	             $('#spinner').show()
	        })
	        curr_layer.on('load', function(){
                 $('#spinner').hide()
	        })
	        curr_layer.setOpacity(0.0);  
	        map.addLayer(curr_layer)
	        curr_layer.setOpacity(opacity)

		    var obj_id = layerid.toString()
		    all_layers[obj_id] = curr_layer

		    if (!overlay){
		    	active_layer = layerid
		    	prev_layers.push(curr_layer);
		    }

		   	var el = document.createElement('li');
		   	var toggle_name = $('#'+ layerid +' .toggle-label').text()
		   	el.id=layerid+'_order'
			el.innerHTML = '<p>' + toggle_name + '</p>' + '<i class="js-remove fa fa-times fa-lg" aria-hidden="true"></i>';
			$(layer_order.el).prepend(el);
			sortLayers()
	    }
	    else{
	    	curr_layer.setOpacity(opacity);  
	    	curr_layer.setZIndex(100)
	        map.addLayer(curr_layer)
		    prev_layers.push(curr_layer);	    
		    active_layer = layerid
	    }

        return all_layers.length-1
	}
	function removeMapLayer(layerid){
		$('#' + layerid + '_order').remove()
		map.removeLayer(all_layers[layerid])
        delete all_layers[layerid];
	}
	function toggleUI(){
		$('#scrubber_container').toggleClass('transform-active');
		$('#time_container').toggleClass('transform-active-left');
		$('#layers-link').toggleClass('transform-active-right');
		$('#sectors-link').toggleClass('transform-active-right');
		$('#options-link').toggleClass('transform-active-right');
		$('#menu-shadow').toggleClass('transform-active-right');
		$('#fullscreen-link').toggleClass('transform-active-right');
		$('.leaflet-control-locate').toggleClass('transform-active-right');
		$('#time_control_container').toggleClass('transform-active');
		$('#options_container').toggleClass('transform-active-right');
		$('.leaflet-control-attribution').toggleClass('transform-active');
    }

	//Things to do on page load
	var speedscrubber = new ScrubberView();
	speedscrubber.min(1).max(20).step(1).value(10);
	$('#speedscrubber').append(speedscrubber.elt);
	var loop_speed = 1000 * (1/(speedscrubber.value()))

	var updatescrubber = new ScrubberView();
	updatescrubber.min(1).max(30).step(1).value(10);
	$('#updatescrubber').append(updatescrubber.elt);
	var auto_update_interval = updatescrubber.value()

	var framesscrubber = new ScrubberView();
	framesscrubber.min(5).max(30).step(1).value(15);
	$('#framesscrubber').append(framesscrubber.elt);

	var progressCircle = new ProgressBar.Circle(time_spinner_view, {
	  strokeWidth: 12,
	  easing: 'easeInOut',
	  duration: 100,
	  color: '#2074B6',
	  trailColor: '#eee',
	  trailWidth: 2,
	  svgStyle: null
	});

	$('.message a').click(function(){
	   $('form').animate({height: "toggle", opacity: "toggle"}, "slow");
	});
	

	$('#time_container').hide()
    $('.layer-dropdown-content').hide()
    $('.menu-link').bigSlide({
        side: 'right',
    });
    $('.cmn-toggle').each(function () {
      $(this).prop('checked', false);
    });
    $('#haptic_toggle').prop('checked', true);
    $('#update_toggle').prop('checked', true);


    $(".vibrate").vibrate({
	    duration: 20,
	    trigger: "touchstart"
	});
	$(".vibrate-light").vibrate({
	    duration: 20,
	    trigger: "touchstart"
	});
	$(".vibrate-toggle").vibrate({
		pattern:[5,200,20]
	});

    speedscrubber.onValueChanged = function (value) {
        $('.speed-display').html(value + ' FPS');
        loop_speed = 1000 * (1/(value))
    }

    updatescrubber.onValueChanged = function (value) {
        $('.update-display').html(value + ' Min');
        auto_update_interval = value
        autoRefresh(auto_update_interval)
    }


    framesscrubber.onValueChanged = function (value) {
        $('.frames-display').html(value);
    }

    var clickedOnFrameScrubber = false
    framesscrubber.onScrubStart = function(value) {
    	clickedOnFrameScrubber = true
    }
    framesscrubber.onScrubEnd = function(value) {
    	if(clickedOnFrameScrubber){
	    	num_times = value
	    	getLayerTimes(active_layer,function(all_times){
	            active_times = all_times      	
	        })
	        clickedOnFrameScrubber = false
	    }
    }

     $('input[type=radio][name=tabs]').change(function() {
     	if(this.value == 'layers'){
     		$('#order-scroll').hide()
     		$('#layers-scroll').fadeIn('fast')
     	}
     	else if (this.value == 'order'){
     		$('#layers-scroll').hide()
     		$('#order-scroll').fadeIn('fast')
     	}
    });

    var layer_el = document.getElementById('layer-list');
	var layer_order = Sortable.create(layer_el, { 
		animation: 150,
		filter: '.js-remove',
		onFilter: function (evt) {
			evt.item.parentNode.removeChild(evt.item);
			var layer_id = evt.item.id.replace('_order','')
			$('#' + layer_id + ' input').trigger('click')

		},
		onSort: function (/**Event*/evt) {
			sortLayers()
			// + indexes from onEnd
		}
		});

	$('#haptic_toggle').on('change', function() {
		if (!$('#haptic_toggle').prop('checked')){
			$(".vibrate").vibrate({
			    duration: 0,
			    trigger: "touchstart"
			});
			$(".vibrate-light").vibrate({
			    duration: 0,
			    trigger: "touchstart"
			});
			$(".vibrate-toggle").vibrate({
				duration: 0
			});
		}
		else{
			$(".vibrate").vibrate({
			    duration: 20,
			    trigger: "touchstart"
			});
			$(".vibrate-light").vibrate({
			    duration: 20,
			    trigger: "touchstart"
			});
			$(".vibrate-toggle").vibrate({
				pattern:[5,200,20]
			});
		}
	});

	$('#update_toggle').on('change',function(){
		if ($(this).prop('checked')){
			$('#updatescrubber').fadeIn('fast')
			autoRefresh(auto_update_interval)
		}
		else{
			$('#updatescrubber').fadeOut('fast')
			clearInterval(refresh_interval)
		}
	})
	$('#update_toggle').trigger('change')

    //Instantly change time display if user changes preference
    $('#UTC_toggle').on('change', function() {
    	if (active_times){
    		curr_time = active_times[value]
            date_time = curr_time.split('_')

            date = date_time[0]
            time = date_time[1]

            year = date.substring( 0, 4 )
            month = date.substring( 4, 6 )
            day = date.substring( 6, 8 )
            hh = time.substring( 0, 2 )
            mm = time.substring( 2, 4 )
            ss = time.substring( 4, 6 )

            date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' UTC'


            if (!$('#UTC_toggle').prop('checked')){
            	$('#time').text(date_time_string);
            }
            else{
            	var userdate = new Date(date_time_string);
				timezone = userdate.toString().match(/\(([A-Za-z\s].*)\)/)[1]
				year =  userdate.getFullYear()
                month = ('0' + (parseInt(userdate.getMonth())+1).toString()).slice(-2)
                day = userdate.getDate()
				hh = ('0' + userdate.getHours()).slice(-2)
				mm = ('0' + userdate.getMinutes()).slice(-2)
				ss = ('0' + userdate.getSeconds()).slice(-2)

				date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' ' + timezone
				$('#time').text(date_time_string);
            }
    	}
    })

    var selected_goes_sector = 'CONUS'
 //   	var southWest = L.latLng(17.837604, -127.089844)
	// var northEast = L.latLng(52.605133, -51.855469)
	// var bounds = L.latLngBounds(southWest, northEast);

    var $goes_sector = $('.goes-sector-select').on('touchstart click',function() {
	    $goes_sector.removeClass('sector-selected');
	    $(this).addClass('sector-selected');
	    selected_goes_sector = $(this)[0].id
	    refreshLayers()

	//     if (selected_goes_sector=='CONUS'){
	//     	var southWest = L.latLng(17.837604, -127.089844)
	// 		var northEast = L.latLng(52.605133, -51.855469)
	//     }
	//     else if (selected_goes_sector=='Mesoscale-1'){
	//     	var southWest = L.latLng(31.887615, -83.611450)
	// 		var northEast = L.latLng(46.492011, -65.291748)
	//     }
	//     else{
	//     	var southWest = L.latLng(17.837604, -127.089844)
	// 		var northEast = L.latLng(52.605133, -51.855469)
	//     }
	//     bounds = L.latLngBounds(southWest, northEast);

	//  //    southWest = L.latLng(13.02504085518189, 80.23609399795532),
	// 	// northEast = L.latLng(13.026849183135116, 80.23797690868378),

	});
	var $zoom_sector = $('.sector-zoom').on('touchstart click',function() {
	    $zoom_sector.removeClass('sector-selected');
	    $(this).addClass('sector-selected');

	    var sector = $(this).find('.zoom-label')[0].innerHTML

	    if(sector=='Central Great Plains'){
	    	map.fitBounds([
			    [43, -106],
			    [32, -90]
			]);
	    }
	    else if(sector=='Northern Great Plains'){
	    	map.fitBounds([
			    [50, -108],
			    [39, -90]
			]);
	    }
	    else if(sector=='Southern Great Plains'){
	    	map.fitBounds([
			    [25, -108],
			    [37, -89]
			]);
	    }
  		else if(sector=='North America'){
	    	map.fitBounds([
			    [70, -167],
			    [11, -46]
			]);
	    }
	    else if(sector=='CONUS'){
	    	map.fitBounds([
			    [49, -128],
			    [24, -65]
			]);
	    }


	    //map.setView([lat, lng], zoom);
	});

	var doTutorial = readCookie('firstVisit')

	var steps = [
              { 
                intro: "Welcome to SatSquatch, a user-friendly weather satellite and mesoanalysis viewer! To exit this tutorial, select 'Skip', otherwise, select 'Next' to continue the tutorial."
              },
              {
                element: '#layers-link',
                intro: "This button opens a menu to add or remove data layers from the map.",
                position: "left"
              },
              {
                element: '#sectors-link',
                intro: "This button opens a menu to change the sector for satellite data, or quickly zoom to a predefined region.",
                position: "left"
              },
              {
                element: '#options-link',
                intro: "This button opens a menu to change various options related to your account, looping, etc.",
                position: "left"
              },
              {
                element: '#options_container_dummy',
                intro: "This button opens a slide out menu with extra buttons for sharing, location, etc.",
                position: "left"
              },    
              {
                element: '#scrubber_container',
                intro: "Use this control to manually scrub through times for the current layer.",
                position: "top"
              },
              {
                element: '#time_control_container',
                intro: "Use these controls to loop through times for the current layer.",
                position: "top"
              },
              { 
                intro: "Thats it! Enjoy your time using SatSquatch. If you have any futher questions please feel free to contact us."
              },
            ]

	var tour = introJs()
	tour.setOption('steps', steps)
	tour.setOption('showStepNumbers', 'false')
	tour.setOption('showProgress','true')
	tour.setOption('showBullets','false')
	tour.setOption('disableInteraction', 'true')

	

	tour.oncomplete(function(){
		createCookie('firstVisit','false',7);
		tutorialActive = false
	})
	tour.onexit(function(){
		createCookie('firstVisit','false',7);
		tutorialActive = false
	})
	var tutorialActive = false
	if (doTutorial != 'false'){ 
		tutorialActive = true
		tour.start()
		
	}




    //UI animations
    $("#layers-link").on('touchstart click',function() {
      toggleUI()
      $('#options-content').hide()
      $('#sectors-content').hide()
      $('#layers-content').show()

      menuIsOpen=true
    });

    $("#options-link").on('touchstart click',function() {
    	if(loginActive){
    		loginActive = false
    	}
    	else{
    		toggleUI()
	      $('#options-content').show()
	      $('#sectors-content').hide()
	      $('#layers-content').hide()

	      menuIsOpen=true
    	}

    });

    $("#sectors-link").on('touchstart click',function() {
      toggleUI()
      $('#options-content').hide()
      $('#sectors-content').show()
      $('#layers-content').hide()

      menuIsOpen=true
    });

    var loginActive = false
    // $("#login-toggle").on('click',function() {
    //   loginActive = true
    //   $('#options-close').trigger('click')
    //   $('#login-container').fadeIn('fast')
    //   $('.login-close').addClass('disabled')
    //   setTimeout(function(){
    //   	$('.login-close').removeClass('disabled')
    //   },250)
    // });

    $("#tutorial-toggle").on('click',function() {
    	$('#options-close').trigger('click')
    	tour.start()
    });

    $(".close").on('touchstart click',function() {
    	if(!loginActive){
    		toggleUI()
      		menuIsOpen=false
    	}
    });

    $(".img-close").on('click',function() {
    	toggleUI()
    	$('#img-container').fadeOut('fast')
    	var img = $('#screenshot');
    	var link = $('#img-link');
        img.attr('src', '');
        link.attr('href', '');
        link.attr('download', '');
    });

    $(".login-close").on('click',function() {
    	if ($(this).hasClass('disabled')){

    	}
    	else{
    		$('#login-container').fadeOut('fast')
    		$("#options-link").trigger('click')
    	}
    });

    $('.dropdown-header').click(function(){
        $(this).children('.layer-dropdown-arrow').toggleClass('rotated');
    });

    $('.dropdown-header').click(function(){

        $(this).next().slideToggle('fast')
    })


    $('#step-back').on('touchstart click',function() {
    	if (active_layer != false){
    		var curr_step = time_slider.getStep()[0]
  			if(curr_step != 0){
  				time_slider.setStep(curr_step-1,0)	
  				setTimeout(function(){
					time_slider.callDragStopCallback(1);
				},500)
  			}
    	}
    });
    $('#step-forward').on('touchstart click',function() {
    	if (active_layer != false){
    		var curr_step = time_slider.getStep()[0]
  			if(curr_step != 0){
  				time_slider.setStep(curr_step+1,0)	
  				setTimeout(function(){
					time_slider.callDragStopCallback(1);
				},500)
  			}
    	}
    });


    //Keyboard looping controls
    $('body').keydown(function(e){
      key = e.key || e.keyCode || e.which
    	if (active_layer != false){
    		var curr_step = time_slider.getStep()[0]
  			if(key==',' || key==188){
  				if(curr_step != 0){
  					time_slider.setStep(curr_step-1,0)	
  				}
  			}
  			else if(key=='.' || key==190){
  				if(curr_step != times_length){
  					time_slider.setStep(curr_step+1,0)				
  				}
  			}
    	}
    });
    $('body').keyup(function(e){
      key = e.key || e.keyCode || e.which
    	if (active_layer != false){
			if(key==',' || key=='.' || key == 188 || key == 190){
				setTimeout(function(){
					time_slider.callDragStopCallback(1);
				},500)

    		}
    	}
    });

    $('#options_container_close').on('touchstart click',function() {
   		var width = 190
   		if($(this).hasClass( 'rotated-y' )){
   			$("#options_container").css({'-webkit-transform': 'translate3d(' + width + 'px, 0px, 0px)', '-moz-transform': 'translate3d(' + width + 'px, 0px, 0px)'});
   			$(".leaflet-control-locate").css({'-webkit-transform': 'translate3d(' + width + 'px, 0px, 0px)', '-moz-transform': 'translate3d(' + width + 'px, 0px, 0px)'});
   		}
   		else{
   			$("#options_container").css({'-webkit-transform': 'translate3d(0px, 0px, 0px)', '-moz-transform': 'translate3d(0px, 0px, 0px)'});
   			$(".leaflet-control-locate").css({'-webkit-transform': 'translate3d(0px, 0px, 0px)', '-moz-transform': 'translate3d(0px, 0px, 0px)'});
   			$("#fullscreen-link").toggleClass('disabled')
   			$("#refresh-link").toggleClass('disabled')
   			$("#share-link").toggleClass('disabled')
   			$(".leaflet-control-locate").toggleClass('disabled')


			setTimeout(
			function() 
			{
				$("#fullscreen-link").toggleClass('disabled')
				$("#refresh-link").toggleClass('disabled')
   				$("#share-link").toggleClass('disabled')
				$(".leaflet-control-locate").toggleClass('disabled')

			}, 600);

   		}
   		$(this).toggleClass('rotated-y');
   });


   $('#time_container_close').on('touchstart click',function() {
   		var width = $("#time_container").width() + 10
   		if(!$(this).hasClass( 'rotated-y' )){
   			$("#time_container").css({'-webkit-transform': 'translate3d(-' + width + 'px, 0px, 0px)', '-moz-transform': 'translate3d(-' + width + 'px, 0px, 0px)'});
   		}
   		else{
   			$("#time_container").css({'-webkit-transform': 'translate3d(0px, 0px, 0px)', '-moz-transform': 'translate3d(0px, 0px, 0px)'});
   		}
   		$(this).toggleClass('rotated-y');
   });

  $('#time_container_close').on('updateWidth',function(){
  		var width = $("#time_container").width() + 10
		if($(this).hasClass( 'rotated-y' )){
			$("#time_container").css({'-webkit-transform': 'translate3d(-' + width + 'px, 0px, 0px)', '-moz-transform': 'translate3d(-' + width + 'px, 0px, 0px)'});
		}
		else{
			$("#time_container").css({'-webkit-transform': 'translate3d(0px, 0px, 0px)', '-moz-transform': 'translate3d(0px, 0px, 0px)'});
		}
  });



    //Initialize map
    var basemap = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
        maxZoom: 18, 
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
      })
    var basemap_lines = L.tileLayer.provider('Stamen.TonerLines')
    var coastlines = L.tileLayer('http://map1.vis.earthdata.nasa.gov/wmts-webmerc/Coastlines/default/2014-08-20/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',{
    	maxNativeZoom:9
    })
	
	    

    // basemap_lines.setZIndex(999);
    // basemap_lines.setOpacity(0.5);

    coastlines.setZIndex(998);
    coastlines.setOpacity(0.8);
    
    var map = L.map('mapid', {
        zoomControl: false,
        center: [40.31304, -98.78906],
        maxBounds: [[-85,-180.0],[85,180.0]],
        minZoom: 3,
        maxZoom: 10,
        zoom: 5,
        layers: [basemap],
        attributionControl: true,
        preferCanvas: true,
        fadeAnimation: true
    });

 //    $.getJSON("http://sharp.weather.ou.edu/tbell/out.geojson", function(data) {
 //    	console.log(data.features)
 //    	L.vectorGrid.slicer(data,{
 //    		vectorTileLayerStyles: {
	//         	sliced:  function(properties, zoom) {
	//         		var color = properties.stroke
	// 	            var level = zoom;
	// 	            var weight = 1;
	// 	            if (level == 2) {weight = 4;}
	// 	            return {
	// 	            	weight: weight,
	// 	                color: color
	// 	            }
	// 	        }
	//         },
	//         tolerance: 20,
	//     }).addTo(map)
 //    	// L.geoJson(data).addTo(map)
	// });


    geojson_options={
    	color: '#2074B6',
    	weight: 1.0,
    }

    var states;
    var coastlines;
    var countrylines;
	$.getJSON('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_1_states_provinces_lines.geojson', function(data) {
	  states = L.geoJson(data,geojson_options).addTo(map);
	});
	$.getJSON('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_coastline.geojson', function(data) {
	  coastlines = L.geoJson(data,geojson_options).addTo(map);
	});
	$.getJSON('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_boundary_lines_land.geojson', function(data) {
	 countrylines = L.geoJson(data,geojson_options).addTo(map);
	});




    $('.leaflet-control-attribution').addClass('transform');


	$('#fullscreen-link').on('click', function(){
		if(!$('#fullscreen-link').hasClass('disabled')){
			$(document).toggleFullScreen();
		}
	})

	$('#refresh-link').on('click', function(){
		if(!$('#refresh-link').hasClass('disabled')){
			refreshLayers()
		}
	})

	$('#share-link').on('click', function(){
		if(!$('#share-link').hasClass('disabled')){
			takeScreenshot()
		}
	})

    var all_layers = {}
    var all_overlays = []
    var active_layer = false
    var active_times = false
    var prev_layerid = false
    var prev_div = false
    var menuIsOpen = false


    var loop_move = false
    map.on('movestart',function(){
    	if(!$('#play').is(":visible")){
    		clearInterval(preload_test)
    		loop_move = true
    		$('#pause').trigger('click');
    		
    	}
    })
    preloading = false
    map.on('moveend',function(){
    	clearInterval(preloading)
		if(loop_move){
			if(preload_ongoing){
				preLoadLoop()
				preloading = setInterval(function(){ 
					if (preload_ongoing == false){
						clearInterval(preloading)
						loop_move = false
						$('#time_spinner').hide()
						$('#play').trigger('click');
					}
				}, 200);
			}
			else{
				loop_move = false
				$('#time_spinner').hide()
				$('#play').trigger('click');
				
			}
		}
    })


    //Add layer to map and remove previous layer
    $('.single_toggle').on('change', 'input.cmn-toggle', function() {

        $('.single_toggle input.cmn-toggle').not(this).prop('checked', false);         
        var layerid = $(this).parent()[0].id

        var opacityscrubber = new ScrubberView();
        opacityscrubber.min(0).max(100).step(1).value(100)

        var layer_info = $(this).data("layer-info")
        if (typeof layer_info != 'undefined'){
          $('#layer-info').text(layer_info)
        }
        else{
          $('#layer-info').text('')
        }



        if(prev_layerid==layerid || !prev_layerid){
            if(this.checked) {

            	var parent_id =  $(this).parent()[0].id
            	var parent_obj = $(this).parent()[0]
            	getLayerTimes(layerid,function(all_times){
            		active_times = all_times

	            	
	            	var url_date_time = active_times[active_times.length-1]
	            	prev_ndx = addMapLayer('http://sharp.weather.ou.edu/tbell/' + layerid + '/' + selected_goes_sector  + '/' + url_date_time + '/{z}/{x}/{-y}.png',layerid)

	    			$('<div class="opacity-div" id=opacity_' + parent_id+ '></div>').insertAfter(parent_obj);
	                $('#opacity_' + parent_id).html('<p class=opacity-display id=opacity_display_' + parent_id + '>100%</p>');
	                $('#opacity_' + parent_id).append(opacityscrubber.elt);
	                $('#time_container').show()

            	})

            }else{
            	removeMapLayer(prev_layerid)
                active_layer = false
                active_times = false

                time_slider.options.steps = 1;
                time_slider.stepRatios = time_slider.calculateStepRatios();
                prev_scrub_tick = false
                time_slider.setStep(0, 0, snap=false)

                $('#time_container').hide()

                $('#opacity_' + $(this).parent()[0].id).remove()
            }
        }else{
        	getLayerTimes(layerid,function(all_times){
        		active_times = all_times
            	var url_date_time = active_times[active_times.length-1]
            	prev_ndx = addMapLayer('http://sharp.weather.ou.edu/tbell/' + layerid + '/' + selected_goes_sector  + '/' + url_date_time + '/{z}/{x}/{-y}.png',layerid)
        	})
        	removeMapLayer(prev_layerid)

            $('<div id=opacity_' + $(this).parent()[0].id + '></div>').insertAfter($(this).parent()[0]);
            $('#opacity_' + $(this).parent()[0].id).html('<p class=opacity-display id=opacity_display_' + $(this).parent()[0].id + '>60%</p>');
            $('#opacity_' + $(this).parent()[0].id).append(opacityscrubber.elt);
            
            $('#opacity_' + prev_div).remove()
            $('#time_container').show()
        }

        prev_layerid = layerid
        prev_div = $(this).parent()[0].id     

        opacityscrubber.onValueChanged = function (value) {
            $('#opacity_display_' + prev_div).html(value+'%');
            all_layers[prev_layerid].setOpacity(value/100.0)
        }

        $('#time_container_close').trigger('updateWidth')

    });
    
    $('.multi_toggle').on('change', 'input.cmn-toggle', function() {  
    	var layerid = $(this).parent()[0].id

        var opacityscrubber = new ScrubberView();
        opacityscrubber.min(0).max(100).step(1).value(60)

        var ndx = $(this).val()  
        if(this.checked) {
        	addMapLayer('http://wms.ssec.wisc.edu/products/'+layerid+'/{z}/{x}/{y}.png',layerid,0.65,false,true)

            $('<div id=opacity_' + $(this).parent()[0].id + '></div>').insertAfter($(this).parent()[0]);
            $('#opacity_' + $(this).parent()[0].id).html('<p class=opacity-display id=opacity_display_' + $(this).parent()[0].id + '>60%</p>');
            $('#opacity_' + $(this).parent()[0].id).append(opacityscrubber.elt);
        }else{
        	removeMapLayer(layerid)
            $('#opacity_' + $(this).parent()[0].id).remove()
        }

        var div = $(this).parent()[0].id 

        opacityscrubber.onValueChanged = function (value) {
        $('#opacity_display_' + div).html(value+'%');
    		all_layers[layerid].setOpacity(value/100.0)
    	}       
    });

    L.control.locate().addTo(map);

    prev_layers = []
    prev_scrub_tick = false

    //Initialize time slider and looping functions
    var time_slider = new Dragdealer('scrubber_container',{
        snap: false,
        slide: false,
        animationCallback: function(x, y) {

            value = Math.round(this.getStep()[0] - 1)
            times_length = active_times.length
            if (times_length > 1 && prev_scrub_tick != value){
                prev_scrub_tick = value

                curr_time = active_times[value]
                date_time = curr_time.split('_')

                date = date_time[0]
                time = date_time[1]

                year = date.substring( 0, 4 )
                month = date.substring( 4, 6 )
                day = date.substring( 6, 8 )
                hh = time.substring( 0, 2 )
                mm = time.substring( 2, 4 )
                ss = time.substring( 4, 6 )

                date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' UTC'


                if (!$('#UTC_toggle').prop('checked')){
                	$('#time').text(date_time_string);
                }
                else{
                	var userdate = new Date(date_time_string);
					timezone = userdate.toString().match(/\(([A-Za-z\s].*)\)/)[1]
					year =  userdate.getFullYear()
	                month = ('0' + (parseInt(userdate.getMonth())+1).toString()).slice(-2)
	                day = userdate.getDate()
					hh = ('0' + userdate.getHours()).slice(-2)
					mm = ('0' + userdate.getMinutes()).slice(-2)
					ss = ('0' + userdate.getSeconds()).slice(-2)

					date_time_string = year+'-'+month+'-'+day+' '+hh+':'+mm+':'+ss+ ' ' + timezone
					$('#time').text(date_time_string);
                }
                if (prev_scrub_tick != false && menuIsOpen != true && refreshing != true){
                	addMapLayer('http://sharp.weather.ou.edu/tbell/' + active_layer + '/' + selected_goes_sector  + '/' +curr_time + '/{z}/{x}/{-y}.png',active_layer,1,true)
                    if (prev_layers.length > 5){
                        map.removeLayer(prev_layers[0])
                        prev_layers.shift()
                    }

                }
                if (refreshing == true){
                	refreshing = false
                }

            }
        },
        callback: function(x, y){
            if (prev_layers.length > 0) {
                while(prev_layers.length > 1){
                    map.removeLayer(prev_layers[0])
                    prev_layers.shift()
                }
                var layer_opacity  = parseFloat($( "#opacity_" +  active_layer).text().replace('%',''))/100.0 
                prev_layers[0].setOpacity(layer_opacity) 

                all_layers[active_layer] = prev_layers[0]

		       	all_layers[active_layer].on('load', function(){
		        	setTimeout(
		              function() 
		              {
		                 $('#spinner').hide()
		              }, 800);
		        })

            }
        }
    });







});