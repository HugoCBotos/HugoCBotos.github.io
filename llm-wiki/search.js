// Client-side search for LLM Wiki
(function() {
    "use strict";
    
    // ─────────────────────────────────────────────────
    // SEARCH INDEX — The LLM adds entries here on every ingest.
    // Format: [keyword, description, relative URL]
    // ─────────────────────────────────────────────────
    var searchIndex = [
        // BNN for Beginners
        ["bnn","Bayesian Neural Networks — beginner-friendly guide","bnn-for-beginners.html"],
        ["bayesian neural network","What is a BNN? Weights as distributions, uncertainty estimation","bnn-for-beginners.html"],
        ["neural network","Function composition, linear layers, activation functions","bnn-for-beginners.html"],
        ["linear layer","Matrix multiplication: y = Wx + b","bnn-for-beginners.html"],
        ["activation function","ReLU, sigmoid, tanh — nonlinearities that make NNs expressive","bnn-for-beginners.html"],
        ["relu","Rectified Linear Unit: max(0, z)","bnn-for-beginners.html"],
        ["forward pass","How data flows through the network","bnn-for-beginners.html"],
        ["backpropagation","Computing gradients via the chain rule","bnn-for-beginners.html"],
        ["gradient descent","Updating weights to reduce loss","bnn-for-beginners.html"],
        ["loss function","Cross-entropy, MSE — measuring prediction error","bnn-for-beginners.html"],
        ["pytorch","Deep learning framework — tensors, autograd, nn.Module","bnn-for-beginners.html"],
        ["tensor","Multi-dimensional array, the fundamental data structure in PyTorch","bnn-for-beginners.html"],
        ["training loop","Forward pass, loss, backward, optimizer step","bnn-for-beginners.html"],
        ["overfitting","Model memorizing training data, poor generalization","bnn-for-beginners.html"],
        ["generalization","Model performing well on unseen data","bnn-for-beginners.html"],
        ["uncertainty","Why standard NNs don't know what they don't know","bnn-for-beginners.html"],
        ["bayesian inference","Prior, likelihood, posterior, Bayes theorem","bnn-for-beginners.html"],
        ["prior","p(w) — belief about weights before seeing data","bnn-for-beginners.html"],
        ["likelihood","p(D|w) — how probable is the data given weights","bnn-for-beginners.html"],
        ["posterior","p(w|D) — belief about weights after seeing data","bnn-for-beginners.html"],
        ["variational inference","Approximate the posterior with a simpler distribution q(w)","bnn-for-beginners.html"],
        ["elbo","Evidence Lower Bound — the objective function for VI","bnn-for-beginners.html"],
        ["kl divergence","KL[q||p] — measuring distance between distributions","bnn-for-beginners.html"],
        ["monte carlo dropout","Use dropout at test time for uncertainty estimates","bnn-for-beginners.html"],
        ["mc dropout","Dropout as a Bayesian approximation","bnn-for-beginners.html"],
        ["laplace approximation","Gaussian posterior from Hessian at the MAP solution","bnn-for-beginners.html"],
        ["mcmc","Markov Chain Monte Carlo — sampling from the posterior","bnn-for-beginners.html"],
        ["hmc","Hamiltonian Monte Carlo — gradient-guided MCMC","bnn-for-beginners.html"],

        // BNN Sources
        ["bnn sources","Reference compendium of BNN papers and resources","bnn-sources.html"],
        ["blundell","Bayes by Backprop — variational inference for BNNs","bnn-sources.html"],
        ["bayes by backprop","Blundell 2015 — learning weight distributions via backprop","bnn-sources.html"],
        ["gal dropout","Dropout as a Bayesian Approximation — Gal & Ghahramani 2016","bnn-sources.html"],
        ["laplace redux","Daxberger 2021 — modern Laplace approximation for BNNs","bnn-sources.html"],
        ["probabilistic backprop","Hernández-Lobato 2015 — moment-matching for BNNs","bnn-sources.html"],
        ["normalizing flows","Louizos 2017 — structured posteriors for BNNs","bnn-sources.html"],
        ["bnn posteriors","Izmailov 2021 — how faithful are BNN approximations?","bnn-sources.html"],
        ["bnn survey","Comprehensive surveys of Bayesian deep learning","bnn-sources.html"],
        ["betancourt hmc","A Conceptual Introduction to Hamiltonian Monte Carlo","bnn-sources.html"],

        // MLE & Conformal Prediction (on Uncertainty page)
        ["mle","Maximum Likelihood Estimation — finding the single best w that makes data most probable","uncertainty.html"],
        ["maximum likelihood","How neural networks are trained: minimize cross-entropy = maximize likelihood","uncertainty.html"],
        ["prediction interval","What range will y fall in? Conformal prediction gives finite-sample guarantees","uncertainty.html"],
        ["conformal prediction","Distribution-free prediction sets with coverage guarantees, no Bayesian assumptions","uncertainty.html"],
        ["conformal","Model-agnostic uncertainty quantification via calibration sets","uncertainty.html"],
    ];

    // ─────────────────────────────────────────────────
    // RENDER SEARCH — exposed globally so nav.js can re-run
    // ─────────────────────────────────────────────────
    window.renderSearch = function() {
        // Remove old search container
        var oldContainer = document.getElementById('search-container');
        if (oldContainer) oldContainer.remove();

        // Detect prefix from current URL
        var path = window.location.pathname;
        var inPages = path.indexOf('/pages/') !== -1;
        var inRaw = path.indexOf('/raw/') !== -1;
        var prefix = inPages || inRaw ? '' : 'pages/';

        // Build search UI
        var container = document.createElement('div');
        container.id = 'search-container';
        container.style.cssText = 'position:relative; margin-bottom:1.5rem;';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'search-box';
        input.placeholder = 'Search wiki pages... (Ctrl+K)';
        input.style.cssText = 'width:100%; padding:0.75rem 1rem; border:2px solid #ddd; border-radius:8px; font-size:1rem; outline:none; box-sizing:border-box; background:#fff; color:#1a1a2e;';
        container.appendChild(input);

        var results = document.createElement('div');
        results.id = 'search-results';
        results.style.cssText = 'display:none; position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #ddd; border-radius:0 0 8px 8px; max-height:400px; overflow-y:auto; z-index:1000; box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        container.appendChild(results);

        var main = document.querySelector('.main-content');
        if (main) {
            main.insertBefore(container, main.firstChild);
        }

        // Build index with correct prefix
        var index = [];
        for (var i = 0; i < searchIndex.length; i++) {
            index.push([searchIndex[i][0], searchIndex[i][1], prefix + searchIndex[i][2]]);
        }

        // Search logic
        input.addEventListener('input', function() {
            var query = this.value.toLowerCase().trim();
            if (!query) {
                results.style.display = 'none';
                return;
            }

            var matches = [];
            for (var i = 0; i < index.length; i++) {
                var item = index[i];
                if (item[0].indexOf(query) !== -1 || item[1].toLowerCase().indexOf(query) !== -1) {
                    matches.push(item);
                    if (matches.length >= 10) break;
                }
            }

            if (matches.length === 0) {
                results.innerHTML = '<div style="padding:0.75rem 1rem; color:#999;">No results found</div>';
            } else {
                var html = '';
                for (var j = 0; j < matches.length; j++) {
                    var m = matches[j];
                    html += '<a href="' + m[2] + '" style="display:block; padding:0.6rem 1rem; text-decoration:none; color:#333; border-bottom:1px solid #eee;">' +
                        '<strong>' + m[0] + '</strong>' +
                        '<span style="display:block; font-size:0.8rem; color:#888;">' + m[1] + '</span></a>';
                }
                results.innerHTML = html;
            }
            results.style.display = 'block';
        });

        // Click outside hides results
        if (!window._searchOutsideHandler) {
            window._searchOutsideHandler = function(e) {
                var c = document.getElementById('search-container');
                if (c && !c.contains(e.target)) {
                    var r = document.getElementById('search-results');
                    if (r) r.style.display = 'none';
                }
            };
            document.addEventListener('click', window._searchOutsideHandler);
        }

        // Ctrl+K focuses search
        if (!window._searchKeyHandler) {
            window._searchKeyHandler = function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    var sb = document.getElementById('search-box');
                    if (sb) sb.focus();
                }
            };
            document.addEventListener('keydown', window._searchKeyHandler);
        }
    };

    // Run on initial load
    window.renderSearch();
})();
