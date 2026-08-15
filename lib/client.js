/**
 * dsh-history-tree — client half (Codex exact turn timeline).
 *
 * Rules:
 *   1. Strictly 1 Dash = 1 Real User Question (提问驱动):
 *      - Ignores deliverables (产物), tool executions, subagents, context injections, steering placeholders.
 *      - Only user messages create a timeline dash. If a turn has no genuine user question, it is skipped.
 *   2. Hover Card:
 *      - Line 1: User's exact prompt from the right-aligned message bubble (pure question, no timestamps)
 *      - Line 2: Actual reply text from the assistant (clean text only, excludes Think/Reasoning, Tool calls, deliverables)
 *      - Line 3: Footer metadata (Time · Duration · Tokens only)
 *   3. Layout:
 *      - Fixed vertical centering on conversation left edge
 *      - Max height constraint (calc(100vh - 220px)) with smooth internal wheel scrolling
 *      - Smooth fisheye wave magnification on hover
 *      - Click jumps smoothly to the turn's user bubble
 */

(function () {
  'use strict';

  window.__ModuleLoader__.load({
    id: 'dsh-history-tree',
    factory: function (require) {
      var module = { exports: {} };
      var exports = module.exports;

      var CSS_ID = 'dsh-history-tree-codex-styles';
      var CSS_TEXT = [
        '/* Codex-style Vertically Centered Fixed Timeline Rail with Max Height & Scroll */',
        '.dsh-ht-fixed-rail-container {',
        '  position: absolute;',
        '  left: 4px;',
        '  top: 50%;',
        '  transform: translateY(-50%);',
        '  width: 36px;',
        '  max-height: calc(100vh - 220px);',
        '  overflow-y: auto;',
        '  overflow-x: hidden;',
        '  display: flex;',
        '  flex-direction: column;',
        '  align-items: flex-start;',
        '  justify-content: flex-start;',
        '  gap: 6px;',
        '  padding: 12px 6px;',
        '  z-index: 95;',
        '  pointer-events: auto !important;',
        '  user-select: none;',
        '  cursor: pointer !important;',
        '  scrollbar-width: none; /* Hide scrollbar Firefox */',
        '}',
        '.dsh-ht-fixed-rail-container::-webkit-scrollbar {',
        '  display: none; /* Hide scrollbar Chrome/Safari */',
        '}',
        '',
        '/* Dash Item & Hit Area */',
        '.dsh-ht-dash-hitbox {',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: flex-start;',
        '  padding: 3px 6px;',
        '  cursor: pointer !important;',
        '  pointer-events: auto !important;',
        '  flex-shrink: 0;',
        '}',
        '.dsh-ht-dash {',
        '  width: 8px;',
        '  height: 2px;',
        '  background: rgba(255, 255, 255, 0.25);',
        '  border-radius: 1px;',
        '  pointer-events: none;',
        '  transition: width 0.12s cubic-bezier(0.2, 0, 0, 1), background 0.12s ease, height 0.12s ease, box-shadow 0.12s ease;',
        '}',
        '',
        '/* Fish-eye Magnification Levels */',
        '.dsh-ht-dash[data-dist="0"] {',
        '  width: 26px;',
        '  height: 2.5px;',
        '  background: #ffffff;',
        '  box-shadow: 0 0 8px rgba(255, 255, 255, 0.55);',
        '}',
        '.dsh-ht-dash[data-dist="1"] {',
        '  width: 19px;',
        '  height: 2.2px;',
        '  background: rgba(255, 255, 255, 0.75);',
        '}',
        '.dsh-ht-dash[data-dist="2"] {',
        '  width: 14px;',
        '  height: 2px;',
        '  background: rgba(255, 255, 255, 0.5);',
        '}',
        '.dsh-ht-dash[data-dist="3"] {',
        '  width: 10px;',
        '  height: 2px;',
        '  background: rgba(255, 255, 255, 0.35);',
        '}',
        '',
        '/* Active (Currently Selected/Last) Dash */',
        '.dsh-ht-dash.active:not([data-dist]) {',
        '  width: 16px;',
        '  height: 2.2px;',
        '  background: var(--dsw-alias-brand-primary, #3b82f6);',
        '  box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);',
        '}',
        '',
        '/* Codex-exact Dark Tooltip Card */',
        '.dsh-ht-card-portal {',
        '  position: fixed;',
        '  z-index: 10000;',
        '  pointer-events: auto !important;',
        '  cursor: pointer !important;',
        '}',
        '.dsh-ht-card {',
        '  width: 330px;',
        '  max-width: calc(100vw - 48px);',
        '  background: #1e1e1e;',
        '  border: 1px solid rgba(255, 255, 255, 0.12);',
        '  border-radius: 10px;',
        '  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04);',
        '  padding: 12px 14px;',
        '  color: var(--dsw-alias-label-primary, #f9fafb);',
        '  font-size: 13px;',
        '  line-height: 1.45;',
        '  display: flex;',
        '  flex-direction: column;',
        '  gap: 8px;',
        '  animation: dshHtCardIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);',
        '  cursor: pointer !important;',
        '}',
        '.dsh-ht-card-title {',
        '  font-size: 13.5px;',
        '  font-weight: 600;',
        '  color: #ffffff;',
        '  line-height: 1.4;',
        '  overflow: hidden;',
        '  display: -webkit-box;',
        '  -webkit-line-clamp: 2;',
        '  -webkit-box-orient: vertical;',
        '}',
        '.dsh-ht-card-body {',
        '  color: #9ca3af;',
        '  font-size: 12.5px;',
        '  line-height: 1.45;',
        '  max-height: 90px;',
        '  overflow: hidden;',
        '  display: -webkit-box;',
        '  -webkit-line-clamp: 3;',
        '  -webkit-box-orient: vertical;',
        '}',
        '.dsh-ht-card-footer {',
        '  display: flex;',
        '  align-items: center;',
        '  gap: 8px;',
        '  flex-wrap: wrap;',
        '  border-top: 1px solid rgba(255, 255, 255, 0.08);',
        '  padding-top: 8px;',
        '  margin-top: 2px;',
        '  font-size: 11.5px;',
        '  color: #86909c;',
        '}',
        '@keyframes dshHtCardIn {',
        '  from { opacity: 0; transform: scale(0.96) translateX(-4px); }',
        '  to { opacity: 1; transform: scale(1) translateX(0); }',
        '}'
      ].join('\n');

      function injectStyles() {
        if (typeof document === 'undefined') return;
        if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]')) return;
        var tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-history-tree';
        tag.dataset.pluginCss = CSS_ID;
        tag.textContent = CSS_TEXT;
        document.head.appendChild(tag);
      }

      var hideTimer = null;

      function triggerLoadOlderIfPresent() {
        var olderBtn = document.querySelector('.Md3f7G_older button, [class*="older"] button');
        if (olderBtn && !olderBtn.disabled) {
          olderBtn.click();
          return true;
        }
        return false;
      }

      function showHoverCard(turnInfo, anchorRect) {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }

        var portal = document.querySelector('.dsh-ht-card-portal');
        if (!portal) {
          portal = document.createElement('div');
          portal.className = 'dsh-ht-card-portal';
          document.body.appendChild(portal);
        }

        var x = Math.max(12, anchorRect.right + 12);
        var y = Math.max(12, anchorRect.top - 20);

        if (y + 190 > window.innerHeight) {
          y = Math.max(12, window.innerHeight - 200);
        }

        portal.style.left = x + 'px';
        portal.style.top = y + 'px';

        var promptText = turnInfo.userText;
        var replySnippet = turnInfo.assistantText || '';

        var html = '';
        html += '<div class="dsh-ht-card">';
        
        // Line 1: User question title (pure text, bold white, no timestamp)
        html += '<div class="dsh-ht-card-title">' + escapeHtml(promptText) + '</div>';
        
        // Line 2: Assistant actual answer text (pure reply, strictly no Think/Bash/Tools/timestamps)
        if (replySnippet) {
          html += '<div class="dsh-ht-card-body">' + escapeHtml(replySnippet) + '</div>';
        }

        // Line 3: Footer metadata (Time · Duration · Tokens only)
        var metaItems = [];
        if (turnInfo.timeStr) {
          metaItems.push(escapeHtml(turnInfo.timeStr));
        }
        if (turnInfo.durationStr) {
          metaItems.push('用时 ' + escapeHtml(turnInfo.durationStr));
        }
        if (turnInfo.tokensStr) {
          metaItems.push(escapeHtml(turnInfo.tokensStr));
        }

        if (metaItems.length > 0) {
          html += '<div class="dsh-ht-card-footer">';
          html += metaItems.join(' · ');
          html += '</div>';
        }

        html += '</div>';

        portal.innerHTML = html;

        portal.onmouseenter = function () {
          if (hideTimer) clearTimeout(hideTimer);
        };
        portal.onmouseleave = function () {
          scheduleHide();
        };
        portal.onclick = function (e) {
          e.stopPropagation();
          jumpToTurn(turnInfo);
        };
      }

      function jumpToTurn(turnInfo) {
        if (turnInfo && turnInfo.targetElement && turnInfo.targetElement.isConnected) {
          turnInfo.targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      function scheduleHide() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
          var portal = document.querySelector('.dsh-ht-card-portal');
          if (portal) portal.remove();
        }, 150);
      }

      function escapeHtml(str) {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // Collect ONLY genuine user question turns
      function collectTurns() {
        var messageNodes = Array.from(document.querySelectorAll('.Md3f7G_flowItem, [class*="flowItem"]'));
        if (messageNodes.length === 0) {
          messageNodes = Array.from(document.querySelectorAll('.Md3f7G_column > *, [class*="column"] > *'));
        }

        if (messageNodes.length === 0) return [];

        var turns = [];
        var currentTurn = null;
        var turnCounter = 1;

        for (var i = 0; i < messageNodes.length; i++) {
          var item = messageNodes[i];
          if (item.classList.contains('dsh-ht-fixed-rail-container') || item.classList.contains('Md3f7G_older')) continue;

          var flowKind = item.getAttribute('data-chat-flow-kind') || '';
          
          // Strictly ignore deliverables, workflow runs, or tools as separate turns
          if (flowKind === 'turn-tail' || flowKind === 'deliverables' || flowKind === 'workflow-run') {
            if (currentTurn) {
              extractTailMeta(item, currentTurn);
            }
            continue;
          }

          // Identify User Message Bubble (Right-aligned prompt)
          var userBubble = item.querySelector('[class*="userStack"] [class*="bubble"], [class*="UserStyleBubble"] [class*="bubble"], [class*="userRow"] [class*="bubble"]');
          var isUser = (flowKind === 'user' || flowKind === 'steering') || Boolean(userBubble) || item.querySelector('[class*="userRow"]');

          if (isUser) {
            var cleanUserText = '';
            if (userBubble) {
              cleanUserText = userBubble.innerText ? userBubble.innerText.trim() : '';
            } else {
              var clone = item.cloneNode(true);
              Array.from(clone.querySelectorAll('button, time, [class*="action"], [class*="time"], [class*="icon"]')).forEach(function(el){ el.remove(); });
              cleanUserText = clone.innerText ? clone.innerText.trim() : '';
            }

            // Only create turn if user question text actually exists
            if (cleanUserText) {
              if (currentTurn) {
                turns.push(currentTurn);
              }
              currentTurn = {
                turnIndex: turnCounter++,
                userText: cleanUserText.slice(0, 140),
                assistantText: '',
                targetElement: item,
                timeStr: '',
                durationStr: '',
                tokensStr: ''
              };
            }
            continue;
          }

          // If inside a turn, extract assistant reply content (strictly ignore think/bash/tools/deliverables)
          if (currentTurn) {
            // Check for turnTail
            var tailInside = item.querySelector('[data-turn-tail]');
            if (tailInside) {
              extractTailMeta(tailInside, currentTurn);
            }

            // Extract assistant reply text
            if (!currentTurn.assistantText) {
              var mdContainers = Array.from(item.querySelectorAll('.Sxvs8a_body, [class*="MarkdownText"], [class*="markdown"], p, li'));
              var candidateText = '';

              for (var mIdx = 0; mIdx < mdContainers.length; mIdx++) {
                var el = mdContainers[mIdx];
                if (el.closest('.QWLzlG_root, [class*="think"], [class*="reasoning"], [class*="Reasoning"], [class*="tool"], [class*="Tool"], [class*="callRow"], [data-turn-tail], [class*="deliverables"]')) {
                  continue;
                }
                var txt = el.innerText ? el.innerText.trim() : '';
                if (txt && !txt.startsWith('Think') && !txt.startsWith('思考') && !txt.startsWith('已读取文件') && !txt.startsWith('已运行命令')) {
                  candidateText += (candidateText ? ' ' : '') + txt;
                  if (candidateText.length > 200) break;
                }
              }

              if (!candidateText) {
                var clone = item.cloneNode(true);
                Array.from(clone.querySelectorAll('.QWLzlG_root, [class*="think"], [class*="reasoning"], [class*="Reasoning"], [class*="tool"], [class*="Tool"], [class*="callRow"], [class*="action"], [class*="Action"], [class*="time"], [class*="Clock"], [data-turn-tail], [class*="deliverables"], button, time')).forEach(function(el){
                  el.remove();
                });
                candidateText = clone.innerText ? clone.innerText.trim() : '';
              }

              if (candidateText) {
                currentTurn.assistantText = candidateText.slice(0, 240);
              }
            }
          }
        }

        if (currentTurn) {
          turns.push(currentTurn);
        }

        return turns;
      }

      function extractTailMeta(tailEl, turnObj) {
        if (!tailEl || !turnObj) return;
        var statsText = tailEl.innerText || '';
        
        // Time
        var timeMatch = statsText.match(/(\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2})|(\d{1,2}:\d{2})/);
        if (timeMatch && !turnObj.timeStr) {
          turnObj.timeStr = timeMatch[0];
        } else if (!turnObj.timeStr) {
          var timeEl = tailEl.querySelector('time, [class*="time"], [class*="clock"]');
          if (timeEl && timeEl.textContent) turnObj.timeStr = timeEl.textContent.trim();
        }

        // Duration
        var durMatch = statsText.match(/用时\s*([0-9\u4e00-\u9fa5\.\s]+)/) || statsText.match(/(\d+分\s*\d+秒|\d+秒|\d+ms|\d+\.\d+s)/);
        if (durMatch && !turnObj.durationStr) {
          turnObj.durationStr = durMatch[1].trim();
        }

        // Tokens
        var tokenMatch = statsText.match(/(\d[\d,]*\s*(?:tokens|tok\/s|tok))/i) || statsText.match(/(\d[\d,]*)\s*个token/i);
        if (tokenMatch && !turnObj.tokensStr) {
          turnObj.tokensStr = tokenMatch[1].trim();
        }
      }

      // Apply fisheye magnification across all dashes relative to hoveredIndex
      function updateFisheye(rail, hoveredIndex) {
        var dashes = rail.querySelectorAll('.dsh-ht-dash');
        dashes.forEach(function (dash, idx) {
          if (hoveredIndex === null) {
            dash.removeAttribute('data-dist');
            return;
          }
          var dist = Math.abs(idx - hoveredIndex);
          if (dist <= 3) {
            dash.setAttribute('data-dist', String(dist));
          } else {
            dash.removeAttribute('data-dist');
          }
        });
      }

      // Render or update fixed rail attached to the left of centerCol
      function syncFixedRail() {
        var centerCol = document.querySelector('.pI_x6G_centerCol, [class*="centerCol"]');
        if (!centerCol || !centerCol.isConnected) {
          var old = document.querySelector('.dsh-ht-fixed-rail-container');
          if (old) old.remove();
          return;
        }

        if (getComputedStyle(centerCol).position === 'static') {
          centerCol.style.position = 'relative';
        }

        var rail = centerCol.querySelector('.dsh-ht-fixed-rail-container');
        var turns = collectTurns();

        if (turns.length === 0) {
          if (rail) rail.remove();
          return;
        }

        if (!rail) {
          rail = document.createElement('div');
          rail.className = 'dsh-ht-fixed-rail-container';
          centerCol.appendChild(rail);

          rail.onmouseleave = function () {
            updateFisheye(rail, null);
            scheduleHide();
          };

          rail.addEventListener('wheel', function (e) {
            e.stopPropagation();
            rail.scrollTop += e.deltaY;
            if (rail.scrollTop <= 10) {
              triggerLoadOlderIfPresent();
            }
          }, { passive: false });
        }

        var html = '';
        for (var t = 0; t < turns.length; t++) {
          var isLast = (t === turns.length - 1);
          html += '<div class="dsh-ht-dash-hitbox" data-turn-idx="' + (t + 1) + '">';
          html += '<div class="dsh-ht-dash ' + (isLast ? 'active' : '') + '"></div>';
          html += '</div>';
        }

        if (rail.innerHTML !== html) {
          rail.innerHTML = html;
        }

        // Bind interactive events to the hitboxes
        var hitboxes = rail.querySelectorAll('.dsh-ht-dash-hitbox');
        hitboxes.forEach(function (box, idx) {
          var info = turns[idx];
          if (!info) return;

          box.onmouseenter = function () {
            updateFisheye(rail, idx);
            var rect = box.getBoundingClientRect();
            showHoverCard(info, rect);

            if (idx <= 1) {
              triggerLoadOlderIfPresent();
            }
          };

          box.onclick = function (e) {
            e.stopPropagation();
            e.preventDefault();
            jumpToTurn(info);

            if (idx === 0) {
              triggerLoadOlderIfPresent();
            }
          };
        });
      }

      var observer = new MutationObserver(function (mutations) {
        var isInternal = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.target && m.target.closest && (m.target.closest('.dsh-ht-fixed-rail-container') || m.target.closest('.dsh-ht-card-portal'))) {
            isInternal = true;
            break;
          }
        }
        if (isInternal) return;
        syncFixedRail();
      });

      function apply(ctx) {
        injectStyles();
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('resize', syncFixedRail, { passive: true });
        setTimeout(syncFixedRail, 500);
      }

      exports.apply = apply;
      exports.default = { apply: apply };
      return module.exports;
    }
  });
})();
