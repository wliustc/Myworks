define(function(require) {
	var loader = require('../../../util/loader/loader');
	var others = require('../../../util/others/others');
	var vote = new (require('../../../util/vote/vote.js'));
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var _ = require('underscore');
	var $ = require('jquery');

	var $module = $('#gold-10');
	// if (!$module.length) {
	// 	return;
	// }

	/* 链接点击事件绑定 */
	$module.on('click', '.bdr, .i_avartar, .picw', function() {
		var link = $(this).parents('.module-gold10').attr('link');
		var appLink = $(this).parents('.module-gold10').attr('applink');
		if (link && appLink) {
			if (others.checkIsInApp()) {
				location.href = link;
			} else {
				location.href = appLink;
			}
			return;
		}
		var that = this;
		if ($(this).attr('username') === 'idol1447728132167') {
			location.href = 'http://chang.pptv.com/idol';
		} else {
			others.openHomePage({
				username: $(that).attr('username')
			});
		}
	});

	/* 投票绑定 */
	$module.on('click', '[sid]', function() {
		var sid = $(this).attr('sid');
		others.limitedDisable($(this), 3600, sid, function() {
			$(this).find('.txt').text('+1');

			var $goldCont = $(this).next('.vote');
			$goldCont.text(Number($goldCont.text()) + 1);

			var $Btn = $(this).parents('.item').find('.count');
			$Btn.text(Number($Btn.text().slice(0, -1)) + 1 + '票');

			vote.vote(sid);
		});
	});
	var voteInit = function() {
		$('[sid]').each(function() {
			var sid = $(this).attr('sid');
			others.limitedDisable($(this), 3600, sid);
		});
	};

	var cycleUpdateVote;
	var cycleUpdateVoteFn = function() {
		var sids = $('[sid]').map(function(i, v) {
			return $(v).attr('sid');
		});
		sids = _.toArray(sids);
		cycleUpdateVote = others.cycleGetVotes(sids, function(data) {
			sids.forEach(function(v, i) {
				var $btn = $('[sid='+ v +']');

				var $goldCont = $btn.next('.vote');
				$goldCont.text(data.votes[v].counter);

				var $Btn = $btn.parents('.item').find('.count');
				$Btn.text(data.votes[v].counter + '票');
			});
		});
	};
	// cycleUpdateVoteFn();
	// setTimeout(cycleUpdateVoteFn, 1000 * 60);

	var clearList = function() {
		$module.empty();
	};

	var compiled = _.template($('#template').html());
	var compiledData;
	var renderList = function(data) {
		var $html = $(compiled(data));
		$html.appendTo($module);
		clearInterval(cycleUpdateVote);
		cycleUpdateVoteFn();
	};

	var swipervs = function() {
		var vsSlider = new Swiper('.swiper-container', {
			slidesPerView: 'auto'
		});
	};

	var getIsRank = function(players, idol) {
		var rankCount = 0;
		players.forEach(function(v) {
			if ((v.g_status === '1' || v.g_status === '4') && v.g_stage === '6') {
				rankCount++;
			}
		});
		if (idol.g_status === '1' || idol.g_status === '4') {
			rankCount++;
		}
		console.log(rankCount);
		return rankCount > 4;
	};
	var nextUpdate = 0,
		stage = 0,
		goback = false;
	var update = function() { // 直播前的数据更新
		var isVoteEnd = false,
			liveStart = false;
		loader.ajax({
			url: 'http://chang.pptv.com/api/home5?stage=6',
			// url: 'http://static9.pplive.cn/chang/datas/gold_5.js',
			jsonpCallback: 'update_1',
			success: function(data) {
				clearList();
				var now = new Date().getTime();
				var playerInfo = data.playerinfo;
				var liveInfo = data.liveinfo;
				var idolInfo = data.idolinfo || {};
				_.extend(idolInfo, {
					username: 'idol1447728132167',
					real_name: idolInfo.cname,
					avatar: idolInfo.photo
				});
				var sortedPlayers = [];
				for (var key in playerInfo) {
					sortedPlayers.push(playerInfo[key]);
				}
				sortedPlayers.sort(function(a, b) {
					return Number(b.votenum) - Number(a.votenum);
				});

				nextUpdate = Number(sortedPlayers[0].vote_end) * 1000 - now; // 直播前投票结束时间点
				if (nextUpdate < 0) {
					stage = 1;
					nextUpdate = others.newDate(liveInfo.start).getTime() - now; // 直播开始时间点
				}
				if (nextUpdate < 0) {
					stage = 2;
					nextUpdate = others.newDate(liveInfo.end).getTime() - now; // 直播结束时间点
				}
				if (nextUpdate < 0 && getIsRank(sortedPlayers, idolInfo)) {
					nextUpdate = 'finish';
					stage = 3;
					var maxVotes = 0;
					loader.ajax({
						url: 'http://chang.pptv.com/api/home5?stage=7',
						// url: 'http://static9.pplive.cn/chang/datas/gold_101.js',
						jsonpCallback: 'update_2',
						success: function(data) {
							var now = new Date().getTime();
							var playerInfo = data.playerinfo;
							var liveInfo = data.liveinfo;
							var idolInfo = data.idolinfo || {};
							var sortedPlayers = [];
							for (var key in playerInfo) {
								sortedPlayers.push(playerInfo[key]);
								maxVotes += Math.max(Number(playerInfo[key].votenum), maxVotes);
							}
							if (idolInfo.g_status === '1') {
								_.extend(idolInfo, {
									username: 'idol1447728132167',
									real_name: idolInfo.cname,
									avatar: idolInfo.photo
								});
								maxVotes += Math.max(Number(idolInfo.votenum), maxVotes);
								idolInfo.promotion = true;
							}
							var rate = maxVotes / 4;
							sortedPlayers.forEach(function(v) {
								v.voteLen = others.getLenth(80, Number(v.votenum), rate);
							});
							if (idolInfo.g_status === '1') {
								idolInfo.voteLen = others.getLenth(80, Number(idolInfo.votenum), rate);
							}
							compiledData = {
								stage: stage,
								idolInfo: idolInfo,
								playerInfo: sortedPlayers,
								liveInfo: liveInfo
							};
							renderList(compiledData);
							voteInit();
						}
					});
				} else {
					if (nextUpdate < 0) {
						nextUpdate = 10 * 1000 * 60; // 直播结束之后等待选手晋级，2分钟轮询
					}
					compiledData = {
						stage: stage,
						idolInfo: idolInfo,
						playerInfo: sortedPlayers,
						liveInfo: liveInfo
					};
					renderList(compiledData);
					voteInit();
					swipervs();
					if (nextUpdate !== 'finish') {
						nextUpdate = Math.min(60 * 1000 * 30, nextUpdate);
						setTimeout(update, nextUpdate);
					}
				}					
			}
		})
	};
	update();
});
