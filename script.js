/**
 * 이 파일은 미니톡 채팅도우미 플러그인의 일부입니다. (https://www.minitalk.io)
 *
 * 채팅메시지를 쉽게 입력할 수 있도록 도움을 주는 플러그인입니다.
 * 
 * @file /plugins/helper/script.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 1.0.0
 * @modified 2020. 12. 24.
 */
me.messageIdx = -1;
me.whisperIdx = -1;

// 미니톡 접속시 플러그인 안내멘트 출력
Minitalk.on("connect",function(minitalk,channel,user) {
	minitalk.ui.printSystemMessage("plugin","[채팅도우미플러그인] 채팅입력칸에서 Tab키를 누르면 최근 귓속말을 보낸유저에게 바로 귓속말을 보낼 수 있으며, 방향키 위(이전), 아래(다음)를 누르면 이전 대화내용을 불러올 수 있습니다.");
});

// 메시지 전송시 해당 내용을 기록하여 둔다.
Minitalk.on("sendMessage",function(minitalk,message,user) {
	var messages = minitalk.storage("helperMessages");
	if (messages == null) {
		messages = [];
	}
	
	messages.push(message);
	while (messages.length > 15) {
		messages.shift();
	}
	
	minitalk.storage("helperMessages",messages);
	me.messageIdx = -1;
	me.whisperIdx = -1;
});

// 귓속말 전송시 대상을 저장한다.
Minitalk.on("sendWhisper",function(minitalk,to,message) {
	var whispers = minitalk.storage("helperWhispers");
	if (whispers == null) {
		whispers = [];
	}
	
	if (whispers.indexOf("[" + to + "]") >= 0) {
		whispers.splice(whispers.indexOf("[" + to + "]"),1);
	}
	
	whispers.push("[" + to + "]");
	minitalk.storage("helperWhispers",whispers);
	
	var messages = minitalk.storage("helperMessages");
	if (messages == null) {
		messages = [];
	}
	
	messages.push("/w " + to + " " + message);
	while (messages.length > 15) {
		messages.shift();
	}
	
	minitalk.storage("helperMessages",messages);
	me.messageIdx = -1;
	me.whisperIdx = -1;
});

// 귓속말을 받았을 때 대상을 저장한다.
Minitalk.on("whisper",function(minitalk,from,message) {
	var whispers = minitalk.storage("helperWhispers");
	if (whispers == null) {
		whispers = [];
	}
	
	if (whispers.indexOf("[" + from.nickname + "]") >= 0) {
		whispers.splice(whispers.indexOf("[" + from.nickname + "]"),1);
	}
	
	whispers.push("[" + from.nickname + "]");
	minitalk.storage("helperWhispers",whispers);
});

// 미니톡 UI 가 정의되면 입력폼에 이벤트를 등록한다.
Minitalk.on("init",function(minitalk) {
	if (Minitalk.version < 70000) {
		var $input = $("div[data-role=input] > input");
	} else {
		var $input = $("div[data-role=input] > textarea");
	}
	
	$input.on("keydown",function(e) {
		// 방향키 위/아래 입력시 순서에 따라 이전 대화기록을 불러온다.
		if (e.keyCode == 38 || e.keyCode == 40) {
			var messages = minitalk.storage("helperMessages");
			if (messages == null) {
				messages = [];
			}
			
			if (e.keyCode == 38) {
				if (me.messageIdx == -1) {
					me.messageIdx = messages.length;
				}
				
				if (me.messageIdx == 0) {
					Minitalk.ui.printSystemMessage("error","채팅기록 제일 처음입니다. 방향키 아래버튼을 눌러 다음 채팅기록을 불러올 수 있습니다.");
					e.preventDefault();
					return;
				}

				$input.val(messages[--me.messageIdx]);
				$input.get(0).select();
			} else {
				if (me.messageIdx >= messages.length - 1) {
					Minitalk.ui.printMessage("error","채팅기록 제일 마지막입니다. 방향키 위버튼을 눌러 이전 채팅기록을 불러올 수 있습니다.");
					e.preventDefault();
					return;
				}

				$input.val(messages[++me.messageIdx]);
				$input.get(0).select();
			}
			
			e.preventDefault();
		}
		
		// 탭키를 눌렀을때 귓속말을 받은사람 또는 보낸사람 닉네임을 순차적으로 입력한다.
		if (e.keyCode == 9) {
			var whispers = minitalk.storage("helperWhispers");
			if (whispers == null) {
				whispers = [];
			}
			
			if (whispers.length == 0) {
				Minitalk.ui.printSystemMessage("error","이전에 대화한 귓속말 상대가 없습니다.");
				e.preventDefault();
				return;
			}
			
			if (me.whisperIdx <= 0) {
				me.whisperIdx = whispers.length;
			}
			
			$input.val("/w " + whispers[--me.whisperIdx].replace(/^\[/,"").replace(/\]$/,"") + " ");
			e.preventDefault();
		}
	});
});