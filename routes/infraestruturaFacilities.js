const express = require("express");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const router = express.Router();

// Helper function to capture screenshots of all required sections with expanded text and modalities
async function captureExpandedTextAndModalities(page, outputFolder) {
  // Função melhorada para lidar com banners de cookies
  const hideCookieBanners = async (page) => {
    try {
      // Tenta diferentes seletores possíveis para o botão de cookies
      const cookieSelectors = [
        "#inicia_cookies",
        "button[ng-click='inicia_cookies']",
        ".cookies-banner button",
        "#cookies-banner button",
        ".mensagem_cookies button",
        "button[contains(text(), 'Aceitar')]",
        "button[contains(text(), 'Entendi')]",
        "button[contains(text(), 'Fechar')]"
      ];

      for (const selector of cookieSelectors) {
        try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`✅ Cookie banner fechado usando seletor: ${selector}`);
          await new Promise((r) => setTimeout(r, 2000));
          return;
          }
        } catch (e) {
          // Continua tentando outros seletores
          continue;
        }
      }

      console.log("ℹ️ Nenhum banner de cookies encontrado");
    } catch (error) {
      console.log("ℹ️ Banner de cookies não encontrado ou já fechado");
    }
  };

  // List of all sections we need to capture
  const sections = [
    {
      internal: "Sobre o Curso",
      display: "Sobre o Curso",
      selector: ".sobre-section",
      action: async (page) => {
        try {
          console.log("🔍 Procurando botão 'mais' para expandir texto...");
          
          // Procura pelo span com "mais" que expande o texto
          const expandButton = await page.evaluate(() => {
            // Procura por diferentes seletores possíveis para o botão "mais"
            const selectors = [
              'span.btn-vermais',
              'span[ng-click*="toggleAboutShowMoreText"]',
              'span[class*="btn-vermais"]',
              'span[class*="vermais"]',
              'span:contains("mais")',
              'button:contains("mais")',
              'a:contains("mais")'
            ];
            
            for (const selector of selectors) {
              try {
                const element = document.querySelector(selector);
                if (element && element.textContent.includes('mais')) {
                  return element;
                }
              } catch (e) {
                continue;
              }
            }
            
            // Busca por qualquer elemento que contenha "mais" e seja clicável
            const allElements = document.querySelectorAll('span, button, a');
            for (const element of allElements) {
              if (element.textContent.trim().includes('mais') && 
                  (element.onclick || element.getAttribute('ng-click'))) {
                return element;
              }
            }
            
            return null;
          });
          
          if (expandButton) {
            console.log("✅ Botão 'mais' encontrado, clicando para expandir texto...");
            
            // Clica no botão para expandir o texto
            await page.evaluate(() => {
              const selectors = [
                'span.btn-vermais',
                'span[ng-click*="toggleAboutShowMoreText"]',
                'span[class*="btn-vermais"]',
                'span[class*="vermais"]'
              ];
              
              for (const selector of selectors) {
                try {
                  const element = document.querySelector(selector);
                  if (element && element.textContent.includes('mais')) {
                    element.click();
                    console.log(`Botão 'mais' clicado usando seletor: ${selector}`);
                    return;
                  }
                } catch (e) {
                  continue;
                }
              }
              
              // Fallback: busca por qualquer elemento clicável com "mais"
              const allElements = document.querySelectorAll('span, button, a');
              for (const element of allElements) {
                if (element.textContent.trim().includes('mais') && 
                    (element.onclick || element.getAttribute('ng-click'))) {
                  element.click();
                  console.log('Botão "mais" clicado via fallback');
                  return;
                }
              }
            });
            
            // Aguarda o texto expandir
            console.log("⏳ Aguardando texto expandir...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log("✅ Texto expandido com sucesso!");
          } else {
            console.log("ℹ️ Botão 'mais' não encontrado - texto pode já estar expandido ou não ter limite");
          }
        } catch (error) {
          console.log(`⚠️ Erro ao expandir texto 'Sobre o Curso': ${error.message}`);
          // Continua mesmo com erro - não deve interromper o processo
        }
      },
    },
    {
      internal: "Modalidade de Ensino",
      display: "Modalidade de Ensino",
      selector: "body", // Usar body como fallback
      action: async (page) => {
        try {
          console.log("Iniciando captura da modalidade de ensino...");

          // Primeiro, verifica se há cookies e remove
          await hideCookieBanners(page);

          console.log("Esperando página carregar completamente...");
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Espera a seção de modalidades estar presente
          await page.waitForSelector(".modalidade-inner", {
            visible: true,
            timeout: 10000,
          });

          // Scroll para garantir visibilidade da seção de modalidades
          await page.evaluate(() => {
            const modalidadeSection = document.querySelector(".modalidade-inner");
            if (modalidadeSection) {
              modalidadeSection.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          console.log("Procurando botão HÍBRIDO...");

          // Espera garantir que a animação do scroll terminou
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Tenta localizar e clicar no botão HÍBRIDO
          try {
            // Busca pelo botão que contém "HÍBRIDO"
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll(".modalidade-front"));
              const hibridoButton = buttons.find((btn) =>
                btn.textContent.includes("HÍBRIDO")
              );
              if (hibridoButton) {
                console.log("Botão HÍBRIDO encontrado, clicando...");
                hibridoButton.click();
              } else {
                console.log("Botão HÍBRIDO não encontrado");
              }
            });
          } catch (e) {
            console.log("Erro ao clicar no botão HÍBRIDO:", e.message);
          }

          console.log("Esperando modal aparecer...");

          // Espera inicial após o clique
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Espera o modal aparecer - tentando diferentes seletores
          let modalFound = false;
          const modalSelectors = [
            ".modal-container",
            ".modal",
            "[class*='modal']",
            "[class*='Modal']"
          ];

          for (const selector of modalSelectors) {
            try {
              await page.waitForSelector(selector, {
                visible: true,
                timeout: 8000,
              });
              console.log(`Modal encontrado com seletor: ${selector}`);
              modalFound = true;
              break;
            } catch (e) {
              console.log(`Seletor ${selector} não encontrado, tentando próximo...`);
            }
          }

          if (!modalFound) {
            console.log("Modal não encontrado com nenhum seletor, tentando captura da tela inteira...");
          }

          // Tempo extra para garantir que todas as animações terminaram e o modal está completamente carregado
          await new Promise(resolve => setTimeout(resolve, 8000)); // Aumentado para 8 segundos

          // Captura o screenshot - estratégia mais robusta para garantir que o modal seja capturado
          let screenshotTaken = false;
          const filename = "02_Modalidade_de_Ensino.png";
          
          // Tentativa 1: Capturar apenas o modal específico
          for (const selector of modalSelectors) {
            try {
              console.log(`Tentando capturar modal com seletor: ${selector}`);
              
              // Verifica se o modal existe e está visível
              const modalInfo = await page.evaluate((sel) => {
                const element = document.querySelector(sel);
                if (!element) return { exists: false, visible: false };
                
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                
                return {
                  exists: true,
                  visible: style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0',
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left
                };
              }, selector);
              
              console.log(`Modal info:`, modalInfo);
              
              if (modalInfo.exists && modalInfo.visible) {
                console.log(`Modal encontrado e visível com seletor: ${selector}`);
                
                // Verifica se o modal tem o conteúdo esperado
                const modalContent = await page.evaluate((sel) => {
                  const element = document.querySelector(sel);
                  if (!element) return null;
                  
                  const title = element.querySelector('h4');
                  const hibridoText = element.querySelector('.modalidade-name span');
                  
                  return {
                    title: title ? title.textContent : null,
                    hibridoText: hibridoText ? hibridoText.textContent : null,
                    hasContent: title && hibridoText
                  };
                }, selector);
                
                console.log(`Conteúdo do modal:`, modalContent);
                
                if (modalContent && modalContent.hasContent) {
                  console.log(`Modal tem conteúdo válido, capturando...`);
                  
                  // Captura o modal específico
                  await page.screenshot({ 
                    path: path.join(outputFolder, filename),
                    clip: {
                      x: modalInfo.left,
                      y: modalInfo.top,
                      width: modalInfo.width,
                      height: modalInfo.height
                    }
                  });
                  
                  console.log(`✅ Screenshot do modal salvo: ${filename}`);
                  screenshotTaken = true;
                  break;
          } else {
                  console.log(`Modal não tem conteúdo válido, tentando próximo seletor...`);
                }
              } else {
                console.log(`Modal com seletor ${selector} não está visível ou não existe`);
              }
            } catch (e) {
              console.log(`Erro ao capturar modal com seletor ${selector}:`, e.message);
            }
          }

          // Tentativa 2: Se não conseguiu capturar o modal específico, captura a tela inteira
          if (!screenshotTaken) {
            try {
              console.log("Tentando capturar tela inteira como fallback...");
              await page.screenshot({ 
                path: path.join(outputFolder, filename),
                fullPage: false // Captura apenas a viewport visível
              });
              console.log(`✅ Screenshot da tela salvo: ${filename}`);
              screenshotTaken = true;
            } catch (e) {
              console.log("Erro ao capturar screenshot da tela:", e.message);
            }
          }

          if (!screenshotTaken) {
            console.log("⚠️ Não foi possível capturar screenshot da modalidade de ensino");
          }

          // IMPORTANTE: Aguardar muito mais tempo para garantir que o screenshot foi salvo corretamente
          console.log("Aguardando para garantir que o screenshot foi capturado e salvo...");
          await new Promise(resolve => setTimeout(resolve, 8000)); // Aumentado para 8 segundos

          // Verificar se o modal ainda está aberto
          const modalStillOpen = await page.evaluate(() => {
            const modalSelectors = ['.modal-container', '.modal', '[class*="modal"]', '[class*="Modal"]'];
            for (const selector of modalSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  return true;
                }
              }
            }
            return false;
          });

          if (modalStillOpen) {
            console.log("✅ Modal ainda está aberto, mantendo aberto por mais tempo...");
            // Aguardar mais tempo para garantir que o arquivo foi salvo
            await new Promise(resolve => setTimeout(resolve, 5000)); // Mais 5 segundos
            console.log("✅ Tempo suficiente para salvamento concluído");
          } else {
            console.log("⚠️ Modal já foi fechado automaticamente");
          }

          // NÃO fechar o modal aqui - deixar aberto para a próxima seção fechar
          console.log("ℹ️ Mantendo modal aberto para ser fechado na próxima seção...");

        } catch (error) {
          console.log("Erro ao capturar modalidade de ensino:", error.message);
          // Não relança o erro para não interromper o script
        }
      },
    },
    {
      internal: "Selecionar uma Turma",
      display: "Selecionar uma Turma",
      selector: ".seletor-container.turma-selecionada",
      action: async (page) => {
        // Primeiro, fechar o modal de modalidades se ainda estiver aberto
        console.log("Verificando se há modal aberto para fechar...");
        try {
          const modalStillOpen = await page.evaluate(() => {
            const modalSelectors = ['.modal-container', '.modal', '[class*="modal"]', '[class*="Modal"]'];
            for (const selector of modalSelectors) {
              const element = document.querySelector(selector);
              if (element) {
                const style = window.getComputedStyle(element);
                if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                  return true;
                }
              }
            }
            return false;
          });

          if (modalStillOpen) {
            console.log("Fechando modal de modalidades antes de capturar Selecionar uma Turma...");
            await page.evaluate(() => {
              const closeButtons = [
                ".modal-close",
                ".modal .close",
                ".modal-container .close",
                "[class*='close']",
                "button[ng-click*='close']",
                "button[ng-click*='Close']"
              ];
              
              for (const selector of closeButtons) {
                const button = document.querySelector(selector);
                if (button) {
                  console.log(`Fechando modal com seletor: ${selector}`);
                  button.click();
                  return true;
                }
              }
              
              // Se não encontrou botão específico, tenta pressionar ESC
              console.log("Tentando fechar modal com tecla ESC");
              const event = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 });
              document.dispatchEvent(event);
              return false;
            });
            
            // Aguarda o modal fechar
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log("✅ Modal fechado antes de capturar Selecionar uma Turma");
          } else {
            console.log("ℹ️ Nenhum modal aberto encontrado");
          }
        } catch (e) {
          console.log("Erro ao fechar modal:", e.message);
        }

        // Agora captura a seção Selecionar uma Turma
        await page.waitForSelector(".seletor-container.turma-selecionada");
        await new Promise((r) => setTimeout(r, 1000)); // Espera para garantir que o conteúdo esteja carregado
      },
    },
    {
      internal: "Programa e Metodologia",
      display: "Programa e Metodologia",
      selector: ".turma-wrapper-content",
      action: async (page) => {
        try {
          console.log("🔍 Iniciando captura múltipla do Programa e Metodologia...");
          await page.waitForSelector(".turma-wrapper-content", { visible: true, timeout: 10000 });
          
          // Aguardar carregamento dos accordions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Detectar número de accordions disponíveis
          const totalAccordions = await page.evaluate(() => {
            // Tentar diferentes seletores para encontrar os accordions
            let accordions = document.querySelectorAll('.accordion.template.campo');
            console.log(`🔍 Detecção - Accordions encontrados com '.accordion.template.campo': ${accordions.length}`);
            
            if (accordions.length === 0) {
              accordions = document.querySelectorAll('.accordion-title.grupo.template');
              console.log(`🔍 Detecção - Accordions encontrados com '.accordion-title.grupo.template': ${accordions.length}`);
            }
            
            if (accordions.length === 0) {
              accordions = document.querySelectorAll('[class*="accordion"]');
              console.log(`🔍 Detecção - Accordions encontrados com '[class*="accordion"]': ${accordions.length}`);
            }
            
            return accordions.length;
          });
          
          console.log(`🎯 Total de accordions detectados: ${totalAccordions}`);
          
          // Para Infraestrutura e Facilities, esperamos 16 accordions
          const expectedAccordions = 16;
          const accordionsToProcess = Math.min(totalAccordions, expectedAccordions);
          
          console.log(`📋 Processando ${accordionsToProcess} accordions...`);
          
          for (let i = 0; i < accordionsToProcess; i++) {
            console.log(`📸 Capturando accordion ${i + 1} de ${accordionsToProcess}...`);
            
            // Encontrar e clicar no accordion específico
            const accordionClicked = await page.evaluate((index) => {
              // Tentar diferentes seletores para encontrar os accordions
              let accordions = document.querySelectorAll('.accordion.template.campo');
              console.log(`🔍 Tentativa 1 - Accordions encontrados com '.accordion.template.campo': ${accordions.length}`);
              
              if (accordions.length === 0) {
                accordions = document.querySelectorAll('.accordion-title.grupo.template');
                console.log(`🔍 Tentativa 2 - Accordions encontrados com '.accordion-title.grupo.template': ${accordions.length}`);
              }
              
              if (accordions.length === 0) {
                accordions = document.querySelectorAll('[class*="accordion"]');
                console.log(`🔍 Tentativa 3 - Accordions encontrados com '[class*="accordion"]': ${accordions.length}`);
              }

              if (index >= accordions.length) {
                console.log(`❌ Índice ${index} fora do range (${accordions.length} accordions disponíveis)`);
                return false;
              }

              const targetAccordion = accordions[index];
              if (!targetAccordion) {
                console.log(`❌ Accordion no índice ${index} não encontrado`);
                return false;
              }

              const title = targetAccordion.textContent ? targetAccordion.textContent.trim().substring(0, 50) : `Accordion ${index + 1}`;
              console.log(`🎯 Processando accordion ${index + 1}: "${title}"`);

              // Fechar todos os accordions primeiro
              console.log('🔒 Fechando todos os accordions primeiro...');
              accordions.forEach(el => {
                const panel = el.nextElementSibling;
                if (panel && panel.style.display !== 'none') {
                  el.click();
                }
              });

              // Aguardar um pouco para o fechamento
              setTimeout(() => {}, 500);

              // Scroll especial para o primeiro accordion para evitar sobreposição do botão "Inscreva-se"
              if (index === 0) {
                console.log('📜 Fazendo scroll especial para o primeiro accordion...');
                window.scrollBy(0, 200);
                setTimeout(() => {}, 300);
              }

              // Agora clicar no accordion alvo
              console.log(`🎯 Clicando no accordion ${index + 1}...`);
              targetAccordion.click();

              // Verificar se abriu e tentar novamente se necessário
              setTimeout(() => {
                const panel = targetAccordion.nextElementSibling;
                if (!panel || panel.style.display === 'none') {
                  console.log('🔄 Accordion não abriu, tentando novamente...');
                  targetAccordion.click();
                  
                  // Se ainda não abriu, tentar clicar diretamente no texto
                  setTimeout(() => {
                    const panel2 = targetAccordion.nextElementSibling;
                    if (!panel2 || panel2.style.display === 'none') {
                      console.log('🔁 Tentando clicar no texto do accordion');
                      targetAccordion.click();
                    }
                  }, 200);
                }
              }, 300);

              return true;
            }, i);
            
            if (accordionClicked) {
              // Aguardar abertura do accordion com mais tempo
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verificar se o accordion realmente abriu
              const accordionOpened = await page.evaluate((index) => {
                // Usar os mesmos seletores da detecção
                let accordions = document.querySelectorAll('.accordion.template.campo');
                if (accordions.length === 0) {
                  accordions = document.querySelectorAll('.accordion-title.grupo.template');
                }
                if (accordions.length === 0) {
                  accordions = document.querySelectorAll('[class*="accordion"]');
                }
                
                if (index >= accordions.length) return false;
                
                const accordion = accordions[index];
                const content = accordion.nextElementSibling;
                if (content && content.style.display !== 'none') {
                  console.log(`✅ Accordion ${index + 1} está aberto`);
                  return true;
                } else {
                  console.log(`⚠️ Accordion ${index + 1} pode não ter aberto`);
                  return false;
                }
              }, i);
              
              if (accordionOpened) {
                // Aguardar mais um pouco para estabilização
                await new Promise(resolve => setTimeout(resolve, 1500));
              } else {
                console.log(`⚠️ Accordion ${i + 1} pode não ter aberto, mas continuando...`);
              }
              
              // Capturar screenshot
              const content = await page.$(".turma-wrapper-content");
              if (content) {
                const filename = `04.${i + 1}_Programa_e_Metodologia.png`;
                try {
                  await content.screenshot({ path: path.join(outputFolder, filename) });
                  console.log(`✅ Screenshot salvo: ${filename}`);
                } catch (screenshotError) {
                  console.error(`❌ Erro ao salvar screenshot ${filename}:`, screenshotError.message);
                }
              }
              
              // Fechar o accordion (clicar novamente)
              await page.evaluate((index) => {
                // Usar os mesmos seletores da detecção
                let accordions = document.querySelectorAll('.accordion.template.campo');
                if (accordions.length === 0) {
                  accordions = document.querySelectorAll('.accordion-title.grupo.template');
                }
                if (accordions.length === 0) {
                  accordions = document.querySelectorAll('[class*="accordion"]');
                }
                
                if (index >= accordions.length) return false;
                
                const accordion = accordions[index];
                console.log(`🔒 Fechando accordion ${index + 1}`);
                accordion.click();
                return true;
              }, i);
              
              // Aguardar fechamento
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log(`❌ Falha ao clicar no accordion ${i + 1}`);
            }
          }
          
          console.log(`✅ Captura múltipla do Programa e Metodologia concluída!`);
        } catch (error) {
          console.log(`⚠️ Erro ao capturar Programa e Metodologia: ${error.message}`);
        }
      },
    },
    {
      internal: "Objetivos e Qualificações",
      display: "Objetivos e Qualificacoes",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Corpo Docente",
      display: "Corpo Docente",
      selector: ".turma-wrapper-content",
      action: async (page) => {
        try {
          console.log("🔍 Iniciando captura múltipla do Corpo Docente...");
          await page.waitForSelector(".turma-wrapper-content", { visible: true, timeout: 10000 });
          
          // Aguardar carregamento do carrossel
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Detectar número de slides de forma mais robusta
          const totalSlides = await page.evaluate(() => {
            // Método 1: contar dots
            const dots = document.querySelectorAll('.slick-dots li');
            console.log(`🔍 Dots encontrados: ${dots.length}`);
            
            // Método 2: contar slides diretos
            const slides = document.querySelectorAll('.slide-coordenador');
            console.log(`🔍 Slides encontrados: ${slides.length}`);
            
            // Método 3: verificar aria-label dos dots
            let maxSlide = 0;
            dots.forEach(dot => {
              const button = dot.querySelector('button');
              if (button) {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel) {
                  const match = ariaLabel.match(/(\d+) of (\d+)/);
                  if (match) {
                    maxSlide = Math.max(maxSlide, parseInt(match[2]));
                  }
                }
              }
            });
            console.log(`🔍 Máximo de slides detectado: ${maxSlide}`);
            
            // Retornar o maior valor encontrado
            return Math.max(dots.length, slides.length, maxSlide);
          });
          
          console.log(`🎠 Carrossel detectado com ${totalSlides} slides`);
          
          if (totalSlides > 1) {
            // Capturar cada slide
            for (let i = 0; i < totalSlides; i++) {
              console.log(`📸 Capturando slide ${i + 1} de ${totalSlides}...`);
              
              // Navegar para o slide específico ANTES de capturar
              console.log(`🎯 Navegando para o slide ${i + 1}...`);
              
              const navigationSuccess = await page.evaluate((targetSlideIndex) => {
                console.log(`🎯 Tentando navegar para slide ${targetSlideIndex}...`);
                
                // Método mais direto: clicar diretamente no dot pelo ID específico
                const dotId = `slick-slide-control${10 + targetSlideIndex - 1}`;
                const dotButton = document.getElementById(dotId);
                
                if (dotButton) {
                  console.log(`✅ Clicando no dot pelo ID: ${dotId}`);
                  dotButton.click();
                  return true;
                }
                
                // Fallback: usar dots pelo índice
                const dots = document.querySelectorAll('.slick-dots li button');
                console.log(`🔍 Total de dots encontrados: ${dots.length}`);
                
                if (dots[targetSlideIndex - 1]) {
                  console.log(`✅ Clicando no dot ${targetSlideIndex - 1}`);
                  dots[targetSlideIndex - 1].click();
                  return true;
                }
                
                // Fallback: usar botões de navegação
                if (targetSlideIndex === 1) {
                  // Para ir ao slide 1, usar botão prev
                  const prevButton = document.querySelector('.paginator-buttons-prev');
                  if (prevButton && !prevButton.classList.contains('slick-disabled')) {
                    console.log(`✅ Usando botão prev para slide 1`);
                    prevButton.click();
                    return true;
                  }
                } else {
                  // Para outros slides, usar botão next
                  const nextButton = document.querySelector('.paginator-buttons-next');
                  if (nextButton && !nextButton.classList.contains('slick-disabled')) {
                    console.log(`✅ Usando botão next`);
                    nextButton.click();
                    return true;
                  }
                }
                
                console.log(`❌ Nenhum método de navegação funcionou`);
                return false;
              }, i + 1);
              
              if (navigationSuccess) {
                // Aguardar transição completa
                console.log(`⏳ Aguardando transição para slide ${i + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Aumentado para 5 segundos
                
                // Verificar se realmente mudou de slide
                const currentSlideInfo = await page.evaluate(() => {
                  const activeDot = document.querySelector('.slick-dots li.slick-active');
                  if (activeDot) {
                    const button = activeDot.querySelector('button');
                    return button ? button.getAttribute('aria-label') : null;
                  }
                  return null;
                });
                
                console.log(`📍 Slide atual após navegação: ${currentSlideInfo}`);
                
                // Verificar se está no slide correto
                const expectedSlide = `${i + 1} of ${totalSlides}`;
                if (currentSlideInfo && currentSlideInfo.includes(expectedSlide)) {
                  console.log(`✅ Confirmação: estamos no slide ${i + 1}!`);
                } else {
                  console.log(`⚠️ Aviso: pode não estar no slide correto. Esperado: ${expectedSlide}, Atual: ${currentSlideInfo}`);
                }
              } else {
                console.log(`❌ Falha na navegação para slide ${i + 1}`);
              }
              
              // Aguardar estabilização antes de capturar
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Capturar screenshot
              const content = await page.$(".turma-wrapper-content");
              if (content) {
                const filename = `06.${i + 1}_Corpo_Docente.png`;
                try {
                  await content.screenshot({ path: path.join(outputFolder, filename) });
                  console.log(`✅ Screenshot salvo: ${filename}`);
                } catch (screenshotError) {
                  console.error(`❌ Erro ao salvar screenshot ${filename}:`, screenshotError.message);
                }
              } else {
                console.log(`❌ Conteúdo não encontrado para slide ${i + 1}`);
              }
            }
            console.log(`✅ Captura múltipla do Corpo Docente concluída!`);
          } else {
            console.log("ℹ️ Apenas 1 slide detectado, capturando normalmente...");
            const content = await page.$(".turma-wrapper-content");
            if (content) {
              const filename = `06.1_Corpo_Docente.png`;
              try {
                await content.screenshot({ path: path.join(outputFolder, filename) });
                console.log(`✅ Screenshot salvo: ${filename}`);
              } catch (screenshotError) {
                console.error(`❌ Erro ao salvar screenshot ${filename}:`, screenshotError.message);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ Erro ao capturar Corpo Docente: ${error.message}`);
        }
      },
    },
    {
      internal: "Cronograma de Aulas",
      display: "Cronograma de Aulas",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Local e Horário",
      display: "Local e Horario",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Valor do Curso",
      display: "Valor do Curso",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Perfil do Aluno",
      display: "Perfil do Aluno",
      selector: ".turma-wrapper-content",
    },
    {
      internal: "Processo Seletivo",
      display: "Processo Seletivo",
      selector: ".turma-wrapper-content",
      action: async (page) => {
        try {
          console.log("🔍 Iniciando captura múltipla do Processo Seletivo...");
          await page.waitForSelector(".turma-wrapper-content", { visible: true, timeout: 10000 });
          
          // Aguardar carregamento dos accordions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const accordionTitles = [
            "1 - INSCRIÇÃO",
            "2 - PROCESSO SELETIVO", 
            "3 - DIVULGAÇÃO DO RESULTADO",
            "4 - MATRÍCULA"
          ];
          
          const filenames = [
            "11.1_Inscricao.png",
            "11.2_Processo_Seletivo.png", 
            "11.3_Divulgacao_do_Resultado.png",
            "11.4_Matricula.png"
          ];
          
          for (let i = 0; i < accordionTitles.length; i++) {
            console.log(`📸 Capturando accordion ${i + 1}: ${accordionTitles[i]}...`);
            
            // Encontrar e clicar no accordion (método mais direto e robusto)
            const accordionClicked = await page.evaluate((title) => {
              const accordions = document.querySelectorAll('.accordion-title.grupo.template');
              console.log(`🔍 Total de accordions encontrados: ${accordions.length}`);

              let targetAccordion = null;
              for (let j = 0; j < accordions.length; j++) {
                const accordion = accordions[j];
                const h4 = accordion.querySelector('h4');
                if (!h4) continue;
                const textContent = h4.textContent.trim();
                console.log(`🔍 Accordion ${j + 1}: "${textContent}"`);
                if (textContent.includes(title) || title.includes(textContent.split(' - ')[1])) {
                  targetAccordion = accordion;
                  break;
                }
              }

              if (!targetAccordion) {
                console.log(`❌ Accordion não encontrado: ${title}`);
                return false;
              }

              // Fechar todos os accordions primeiro
              console.log('🔒 Fechando todos os accordions primeiro...');
              accordions.forEach(el => {
                if (el.classList.contains('active')) {
                  el.click();
                }
              });

              // Aguardar um pouco para o fechamento
              setTimeout(() => {}, 500);

              // Agora clicar no accordion alvo
              console.log(`🎯 Clicando no accordion alvo: ${title}`);
              targetAccordion.click();

              // Verificar se abriu e tentar novamente se necessário
              setTimeout(() => {
                const panel = targetAccordion.nextElementSibling;
                if (!panel || panel.style.display === 'none') {
                  console.log('🔄 Accordion não abriu, tentando novamente...');
                  targetAccordion.click();
                  
                  // Se ainda não abriu, tentar clicar diretamente no h4
                  setTimeout(() => {
                    const panel2 = targetAccordion.nextElementSibling;
                    if (!panel2 || panel2.style.display === 'none') {
                      const h4 = targetAccordion.querySelector('h4');
                      if (h4) {
                        console.log('🔁 Tentando clicar no h4 do accordion');
                        h4.click();
                      }
                    }
                  }, 200);
                }
              }, 300);

              return true;
            }, accordionTitles[i]);
            
            if (accordionClicked) {
              // Aguardar abertura do accordion com mais tempo
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verificar se o accordion realmente abriu
              const accordionOpened = await page.evaluate((title) => {
                const accordions = document.querySelectorAll('.accordion-title.grupo.template');
                for (const accordion of accordions) {
                  const h4 = accordion.querySelector('h4');
                  if (h4 && h4.textContent.trim().includes(title)) {
                    const content = accordion.nextElementSibling;
                    if (content && content.style.display !== 'none') {
                      console.log(`✅ Accordion "${title}" está aberto`);
                      return true;
                    } else {
                      console.log(`⚠️ Accordion "${title}" pode não ter aberto`);
                      return false;
                    }
                  }
                }
                return false;
              }, accordionTitles[i]);
              
              if (accordionOpened) {
                // Aguardar mais um pouco para estabilização
                await new Promise(resolve => setTimeout(resolve, 1500));
              } else {
                console.log(`⚠️ Accordion ${accordionTitles[i]} pode não ter aberto, mas continuando...`);
              }
              
              // Capturar screenshot
              const content = await page.$(".turma-wrapper-content");
              if (content) {
                try {
                  await content.screenshot({ path: path.join(outputFolder, filenames[i]) });
                  console.log(`✅ Screenshot salvo: ${filenames[i]}`);
                } catch (screenshotError) {
                  console.error(`❌ Erro ao salvar screenshot ${filenames[i]}:`, screenshotError.message);
                }
              }
              
              // Fechar o accordion (clicar novamente)
              await page.evaluate((title) => {
                const accordions = document.querySelectorAll('.accordion-title.grupo.template');
                for (const accordion of accordions) {
                  const h4 = accordion.querySelector('h4');
                  if (h4 && h4.textContent.trim().includes(title)) {
                    console.log(`🔒 Fechando accordion: ${title}`);
                    accordion.click();
                    return true;
                  }
                }
                return false;
              }, accordionTitles[i]);
              
              // Aguardar fechamento
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.log(`❌ Falha ao clicar no accordion: ${accordionTitles[i]}`);
            }
          }
          
          console.log(`✅ Captura múltipla do Processo Seletivo concluída!`);
        } catch (error) {
          console.log(`⚠️ Erro ao capturar Processo Seletivo: ${error.message}`);
        }
      },
    },
    {
      internal: "Perguntas frequentes (FAQ)",
      display: "Perguntas frequentes FAQ",
      selector: ".turma-wrapper-content",
      action: async (page) => {
        try {
          console.log("🔍 Iniciando captura múltipla das Perguntas Frequentes (FAQ)...");
          
          // Selecionar a aba FAQ
          await page.evaluate(() => {
            const faqDiv = Array.from(document.querySelectorAll('.menu-item button')).find(button => {
              return button.innerText.trim().toLowerCase().includes("perguntas frequentes");
            });
            if (faqDiv) faqDiv.click();
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          await page.waitForSelector(".turma-wrapper-content", { visible: true, timeout: 10000 });
          
          // Aguardar mais tempo para o conteúdo FAQ carregar completamente
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Tentar encontrar os accordions FAQ com seletor mais específico
          await page.waitForSelector("button.accordion.template.campo", { visible: true, timeout: 10000 });
          
          // Verificar se encontrou os accordions FAQ
          const faqAccordions = await page.$$('button.accordion.template.campo');
          console.log(`🔍 Accordions FAQ encontrados: ${faqAccordions.length}`);
          
          if (faqAccordions.length === 0) {
            console.error("❌ Nenhum accordion FAQ encontrado!");
            return;
          }
          
          // Aguardar carregamento dos accordions
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Detectar número de accordions (sempre 11 para Cuidados Paliativos FAQ)
          const totalAccordions = 11;
          console.log(`🎠 Accordions FAQ detectados: ${totalAccordions} (fixo para Infraestrutura/Facilities)`);
          
          const filenames = [
            "12.1_Perguntas_frequentes_FAQ.png",
            "12.2_Perguntas_frequentes_FAQ.png", 
            "12.3_Perguntas_frequentes_FAQ.png",
            "12.4_Perguntas_frequentes_FAQ.png",
            "12.5_Perguntas_frequentes_FAQ.png",
            "12.6_Perguntas_frequentes_FAQ.png",
            "12.7_Perguntas_frequentes_FAQ.png",
            "12.8_Perguntas_frequentes_FAQ.png",
            "12.9_Perguntas_frequentes_FAQ.png",
            "12.10_Perguntas_frequentes_FAQ.png",
            "12.11_Perguntas_frequentes_FAQ.png"
          ];
          
          for (let i = 0; i < totalAccordions; i++) {
            console.log(`📸 Capturando FAQ accordion ${i + 1} de ${totalAccordions}...`);
            
            // Encontrar e clicar no accordion (método mais direto e robusto)
            const accordionClicked = await page.evaluate((index) => {
              const accordions = document.querySelectorAll('.accordion.template.campo');
              console.log(`🔍 Total de accordions FAQ encontrados: ${accordions.length}`);

              if (index >= accordions.length) {
                console.log(`❌ Índice ${index} maior que número de accordions disponíveis`);
                return false;
              }

              const targetAccordion = accordions[index];
              if (!targetAccordion) {
                console.log(`❌ Accordion FAQ no índice ${index} não encontrado`);
                return false;
              }

              // Fechar todos os accordions primeiro
              console.log('🔒 Fechando todos os accordions FAQ primeiro...');
              accordions.forEach(el => {
                const panel = el.nextElementSibling;
                if (panel && panel.style.display !== 'none') {
                  el.click();
                }
              });

              // Aguardar um pouco para o fechamento
              setTimeout(() => {}, 500);

              // Agora clicar no accordion alvo
              console.log(`🎯 Clicando no accordion FAQ ${index + 1}...`);
              targetAccordion.click();

              // Verificar se abriu e tentar novamente se necessário
              setTimeout(() => {
                const panel = targetAccordion.nextElementSibling;
                if (!panel || panel.style.display === 'none') {
                  console.log('🔄 Accordion FAQ não abriu, tentando novamente...');
                  targetAccordion.click();
                  
                  // Se ainda não abriu, tentar clicar diretamente no texto
                  setTimeout(() => {
                    const panel2 = targetAccordion.nextElementSibling;
                    if (!panel2 || panel2.style.display === 'none') {
                      console.log('🔁 Tentando clicar no texto do accordion FAQ');
                      targetAccordion.click();
                    }
                  }, 200);
                }
              }, 300);

              return true;
            }, i);
            
            if (accordionClicked) {
              // Aguardar abertura do accordion com mais tempo
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verificar se o accordion realmente abriu
              const accordionOpened = await page.evaluate((index) => {
                const accordions = document.querySelectorAll('.accordion.template.campo');
                if (index >= accordions.length) return false;
                
                const accordion = accordions[index];
                const content = accordion.nextElementSibling;
                if (content && content.style.display !== 'none') {
                  console.log(`✅ Accordion FAQ ${index + 1} está aberto`);
                  return true;
                } else {
                  console.log(`⚠️ Accordion FAQ ${index + 1} pode não ter aberto`);
                  return false;
                }
              }, i);
              
              if (accordionOpened) {
                // Aguardar um pouco mais para garantir que o conteúdo está totalmente carregado
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Capturar screenshot
                const content = await page.$('.turma-wrapper-content');
                if (content) {
                  const filename = filenames[i];
                  await content.screenshot({ path: path.join(outputFolder, filename) });
                  console.log(`✅ Screenshot FAQ salvo: ${filename}`);
                } else {
                  console.warn(`⚠️ Conteúdo FAQ não encontrado para accordion ${i + 1}`);
                }
              } else {
                console.warn(`⚠️ Accordion FAQ ${i + 1} não abriu corretamente, pulando...`);
              }
            } else {
              console.warn(`⚠️ Não foi possível clicar no accordion FAQ ${i + 1}`);
            }
            
            // Aguardar entre capturas
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          console.log(`✅ Captura múltipla do FAQ concluída!`);
        } catch (error) {
          console.error(`⚠️ Erro ao capturar FAQ: ${error.message}`);
        }
      },
    },
  ];

  // Objeto para armazenar informações sobre as capturas de tela
  const screenshots = []; // For each section
  for (const section of sections) {
    console.log(`📸 Capturando seção: ${section.internal}`);
    await new Promise((r) => setTimeout(r, 1000)); // Aguarda entre cada seção

    try {
      // Verifica se a página ainda está conectada
      if (page.isClosed()) {
        console.error(`❌ Página foi fechada durante captura de ${section.internal}`);
        continue;
      }

      // Clica no botão da seção com tratamento de erro melhorado
    try {
      const [navigation] = await Promise.all([
        page
          .waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
          .catch(() => null),
        page.evaluate((text) => {
          const btns = Array.from(document.querySelectorAll("button"));
          const target = btns.find((btn) =>
            btn.textContent.trim().includes(text)
          );
          if (target) target.click();
        }, section.internal),
      ]);
      } catch (navError) {
        console.log(`⚠️ Erro de navegação para ${section.internal}, continuando...`);
      }

      // Espera o conteúdo aparecer com timeout maior
      try {
      await page.waitForSelector(section.selector, {
        visible: true,
          timeout: 15000,
      });
      await new Promise((r) => setTimeout(r, 1000));
      } catch (selectorError) {
        console.log(`⚠️ Seletor ${section.selector} não encontrado para ${section.internal}`);
        continue;
      }

      if (section.action) {
        try {
        await section.action(page);
        } catch (actionError) {
          console.log(`⚠️ Erro na ação específica para ${section.internal}: ${actionError.message}`);
          // Continua mesmo com erro na ação específica
        }
        // Se for Corpo Docente, Processo Seletivo, Programa e Metodologia ou FAQ, pular a captura automática pois já foi feita pela action
        if (section.internal === "Corpo Docente" || section.internal === "Processo Seletivo" || section.internal === "Programa e Metodologia" || section.internal === "Perguntas frequentes (FAQ)") {
          console.log(`ℹ️ ${section.internal} já foi capturado pela action personalizada, pulando captura automática`);
          continue;
        }
      }

      // Esconde banners de cookies antes de cada screenshot
      await hideCookieBanners(page);

      const content = await page.$(section.selector);

      if (content) {
        const index = sections.indexOf(section) + 1;
        const paddedIndex = index < 10 ? `0${index}` : index;
        const filename =
          `${paddedIndex}_${section.display}`
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "_")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/_+/g, "_")
            .replace(/_$/, "") + ".png";

        try {
        await content.screenshot({ path: path.join(outputFolder, filename) });
        console.log(`✅ Screenshot saved: ${filename}`);
        } catch (screenshotError) {
          console.error(`❌ Erro ao salvar screenshot para ${section.internal}: ${screenshotError.message}`);
        }
      } else {
        console.error(`❌ Content not found for section: ${section.internal}`);
      }
    } catch (error) {
      console.error(
        `❌ Error capturing section ${section.internal}:`,
        error.message
      );
      // Continua para a próxima seção mesmo com erro
    }
  }

  // Ordena as capturas de tela com base no índice da seção (a ordem original do array sections)
  screenshots.sort((a, b) => a.index - b.index);

  // Renomeia os arquivos para garantir a sequência correta
  const finalScreenshots = [];
  screenshots.forEach((screenshot, index) => {
    // Calcula o número principal e decimal
    const mainNumber = Math.floor(index / 10) + 1;
    const subNumber = index % 10;
    const fileIndex = index + 1;
    const paddedIndex = fileIndex < 10 ? `0${fileIndex}` : fileIndex;

    const orderedFilename =
      `${paddedIndex}_${screenshot.section.display}`
        .replace(/[^\w\s]/gi, "")
        .replace(/\s+/g, "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/_+/g, "_")
        .replace(/_$/, "") + ".png";

    const oldPath = path.join(outputFolder, screenshot.filename);
    const newPath = path.join(outputFolder, orderedFilename);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      finalScreenshots.push(orderedFilename);
      console.log(`✅ Renamed to: ${orderedFilename}`);
    } else {
      console.error(`❌ File not found for renaming: ${oldPath}`);
    }
  });

  // Retorna apenas os nomes dos arquivos ordenados
  return finalScreenshots;
}


// 1. Unidade Paulista | Quinzenal Prática Estendida
router.post("/run-script-infraestrutura-mensal", async (req, res) => {
  try {
    const url =
      "https://ensino.einstein.br/pos_gt_infraestrutura_facilities_saude_p14827/p?sku=10906&cidade=sp";
      const semesterUtils = require("../utils/semester");

      // Usar semestre personalizado se fornecido, senão usar semestre atual
      let semesterFolder;
      if (req.body && req.body.semester) {
        const customSemester = req.body.semester.trim();
        // Validar formato do semestre (YYYY-N onde N pode ser qualquer número)
        const semesterRegex = /^\d{4}-\d+$/;
        
        if (!semesterRegex.test(customSemester)) {
          console.log(`❌ Semestre inválido fornecido: ${customSemester}`);
          return res.status(400).json({ 
            error: "Semestre inválido. Use o formato YYYY-N (ex: 2025-1, 2025-81, 2025-92)" 
          });
        }
        
        semesterFolder = customSemester;
        console.log(`📅 Usando semestre personalizado: ${semesterFolder}`);
      } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const semester = month <= 6 ? "1" : "2";
        semesterFolder = `${year}-${semester}`;
        console.log(`📅 Usando semestre automático: ${semesterFolder}`);
      }

    // Função auxiliar para verificar se existe pasta para um determinado semestre e se tem prints
    const checkSemesterHasPrints = (folder) => {
      if (fs.existsSync(folder)) {
        const files = fs.readdirSync(folder).filter((f) => f.endsWith(".png"));
        return files.length > 0;
      }
      return false;
    };

    // Função para obter o nome completo do curso e subcurso
    const getCourseFolderName = (courseName, subcourseName) => {
      const courseMap = {
        "Cuidados Paliativos": "Pós-graduação em Cuidados Paliativos",
        "Bases da Saúde Integrativa e Bem-Estar": "Pós-graduação em Bases da Saúde Integrativa e Bem-Estar",
        "Dependência Química": "Pós-graduação em Dependência Química",
        "Gestão de Infraestrutura e Facilities em Saúde": "Pós-graduação em Gestão de Infraestrutura e Facilities em Saúde",
        "Psiquiatria Multiprofissional": "Pós-graduação em Psiquiatria Multiprofissional",
        "Sustentabilidade: Liderança e Inovação em ESG": "Pós-graduação em Sustentabilidade - Liderança e Inovação em ESG"
      };

      const subcourseMap = {
        "Unidade Paulista | Quinzenal Prática Estendida": "Prática Estendida",
        "Unidade Paulista | Quinzenal": "Quinzenal",
        "Unidade Rio de Janeiro | Mensal": "RJ-Mensal",
        "Unidade Goiânia | Mensal": "GO-Mensal",
        "Unidade Paulista | Semanal": "Semanal",
        "Unidade Paulista | Mensal": "Mensal"
      };

      const fullCourseName = courseMap[courseName] || courseName;
      const fullSubcourseName = subcourseMap[subcourseName] || subcourseName;
      
      return {
        courseFolder: fullCourseName,
        subcourseFolder: fullSubcourseName
      };
    };

    // Buscar próximo semestre disponível (que não tenha prints)
    let basePath = path.join("C:", "Users", "drt62324", "Documents", "Pós Graduação");
    const courseInfo = getCourseFolderName("Gestão de Infraestrutura e Facilities em Saúde", "Unidade Paulista | Mensal");
    let courseFolder = path.join(basePath, courseInfo.courseFolder);
    let semesterFolderPath = path.join(courseFolder, `${courseInfo.subcourseFolder} ${semesterFolder}`);
    if (!fs.existsSync(semesterFolderPath)) {
      fs.mkdirSync(semesterFolderPath, { recursive: true });
    }
    const outputFolder = semesterFolderPath;

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.setViewport({ width: 1280, height: 800 });

    // Remove pop-up de cookies
    try {
      await page.waitForSelector("button", { timeout: 60000 });
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const aceitar = btns.find((btn) =>
          btn.textContent.trim().includes("Entendi e Fechar")
        );
        if (aceitar) aceitar.click();
      });
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {}

    // Handle cookie consent banner
    const cookieBannerSelector = ".mensagem_cookies";
    const cookieButtonSelector = "button[ng-click='inicia_cookies']";

    if (await page.$(cookieBannerSelector)) {
      console.log("🔧 Handling cookie consent banner...");
      try {
        await page.click(cookieButtonSelector);
        await page.waitForSelector(cookieBannerSelector, {
          hidden: true,
          timeout: 5000,
        });
        console.log("✅ Cookie consent banner closed.");
      } catch (error) {
        console.error(
          "❌ Failed to handle cookie consent banner:",
          error.message
        );
      }
    } else {
      console.log("ℹ️ No cookie consent banner detected.");
    }

    // Scroll to the button group
    await page.evaluate(() => {
      const btn = document.querySelector("button");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Use the helper function to capture all required sections with expanded text
    const screenshotFiles = await captureExpandedTextAndModalities(
      page,
      outputFolder
    );

    await browser.close();

    // Map the ordered screenshot filenames to their full paths
    const files = screenshotFiles.map(
      (filename) => `/${courseInfo.courseFolder}/${courseInfo.subcourseFolder} ${semesterFolder}/${filename}`
    );

    return res.json(files);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
