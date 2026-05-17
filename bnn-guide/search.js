// Simple client-side search for the BNN tutorial
(function() {
    "use strict";
    
    // Detect if we're in the pages/ subdirectory or at the root
    var isInPages = window.location.pathname.indexOf('/pages/') !== -1;
    var prefix = isInPages ? '' : 'pages/';

    var searchIndex = [
        ["neural network","What is a neural network? Layers, weights, activations",prefix+"neural-network.html"],
        ["linear layer","Matrix multiplication: y = Wx + b",prefix+"neural-network.html"],
        ["activation function","ReLU, sigmoid, tanh",prefix+"neural-network.html"],
        ["relu","Rectified Linear Unit: max(0, z)",prefix+"neural-network.html"],
        ["forward pass","How data flows through the network",prefix+"neural-network.html"],
        ["backpropagation","Computing gradients via the chain rule",prefix+"neural-network.html"],
        ["gradient descent","Updating weights to reduce loss",prefix+"neural-network.html"],
        ["loss function","Cross-entropy, MSE",prefix+"neural-network.html"],
        ["bayesian inference","Prior, likelihood, posterior, Bayes theorem",prefix+"bayesian-inference.html"],
        ["prior","p(w) — belief before seeing data",prefix+"bayesian-inference.html"],
        ["likelihood","p(D|w) — how probable data is given weights",prefix+"bayesian-inference.html"],
        ["posterior","p(w|D) — belief after seeing data",prefix+"bayesian-inference.html"],
        ["bayes theorem","p(w|D) = p(D|w)p(w) / p(D)",prefix+"bayesian-inference.html"],
        ["evidence","p(D) — the normalizing constant",prefix+"bayesian-inference.html"],
        ["probability distribution","Gaussian, PDF, expectation, variance",prefix+"probability-distributions.html"],
        ["gaussian","Normal distribution N(mu, sigma^2)",prefix+"probability-distributions.html"],
        ["expectation","E[X] — average value",prefix+"probability-distributions.html"],
        ["variance","Var[X] — spread of distribution",prefix+"probability-distributions.html"],
        ["covariance matrix","How variables co-vary",prefix+"probability-distributions.html"],
        ["multivariate gaussian","Multi-dimensional Gaussian",prefix+"probability-distributions.html"],
        ["sampling","Drawing random values from a distribution",prefix+"probability-distributions.html"],
        ["uncertainty","Aleatoric vs epistemic",prefix+"uncertainty.html"],
        ["aleatoric","Irreducible uncertainty from data noise",prefix+"uncertainty.html"],
        ["epistemic","Reducible uncertainty from lack of knowledge",prefix+"uncertainty.html"],
        ["predictive uncertainty","Total uncertainty when predicting",prefix+"uncertainty.html"],
        ["out of distribution","Detecting novel inputs via high uncertainty",prefix+"uncertainty.html"],
        ["kl divergence","KL[q||p] — distance between distributions",prefix+"kl-divergence.html"],
        ["mode-seeking","KL[q||p] finds one mode, is narrow",prefix+"kl-divergence.html"],
        ["zero-avoiding","KL penalty when q has mass where p has none",prefix+"kl-divergence.html"],
        ["elbo","Evidence Lower Bound — objective of VI",prefix+"evidence-lower-bound.html"],
        ["evidence lower bound","ELBO = data fit - KL regularization",prefix+"evidence-lower-bound.html"],
        ["data fit term","E_q[log p(D|w)]",prefix+"evidence-lower-bound.html"],
        ["variational inference","Learning a distribution over weights via ELBO",prefix+"variational-inference.html"],
        ["bayes by backprop","Blundell 2015 — VI with reparameterization trick",prefix+"variational-inference.html"],
        ["reparameterization trick","w = mu + sigma*eps for gradient flow",prefix+"variational-inference.html"],
        ["bayesian linear layer","PyTorch layer with mean and std parameters",prefix+"variational-inference.html"],
        ["mc dropout","Dropout at test time for uncertainty",prefix+"mc-dropout.html"],
        ["monte carlo dropout","Gal 2016 — dropout as variational inference",prefix+"mc-dropout.html"],
        ["dropout","Randomly zeroing neurons during training",prefix+"mc-dropout.html"],
        ["concrete dropout","Learning the dropout rate via gradient descent",prefix+"mc-dropout.html"],
        ["laplace approximation","Gaussian posterior from Hessian at MAP",prefix+"laplace-approximation.html"],
        ["hessian","Second derivatives of loss",prefix+"laplace-approximation.html"],
        ["kfac","Kronecker-factored Hessian approximation",prefix+"laplace-approximation.html"],
        ["last layer laplace","Only infer uncertainty in the final layer",prefix+"laplace-approximation.html"],
        ["map","Maximum A Posteriori — standard NN weights",prefix+"laplace-approximation.html"],
        ["mcmc","Markov Chain Monte Carlo — sampling from posterior",prefix+"mcmc-hmc.html"],
        ["hmc","Hamiltonian Monte Carlo — gradient-guided MCMC",prefix+"mcmc-hmc.html"],
        ["hamiltonian monte carlo","Gold standard for Bayesian inference",prefix+"mcmc-hmc.html"],
        ["metropolis hasting","Random-walk MCMC with acceptance rule",prefix+"mcmc-hmc.html"],
        ["leapfrog","Numerical integration for HMC dynamics",prefix+"mcmc-hmc.html"],
        ["nuts","No-U-Turn Sampler — automated HMC",prefix+"mcmc-hmc.html"],

        // MLE & Conformal Prediction (on Uncertainty page)
        ["mle","Maximum Likelihood Estimation — finding the single best w",prefix+"uncertainty.html"],
        ["maximum likelihood","Training NNs = maximizing likelihood = minimizing cross-entropy",prefix+"uncertainty.html"],
        ["prediction interval","What range will y fall in? Conformal prediction gives guarantees",prefix+"uncertainty.html"],
        ["conformal prediction","Distribution-free prediction sets with finite-sample coverage",prefix+"uncertainty.html"],
        ["conformal","Model-agnostic uncertainty quantification, no Bayesian assumptions",prefix+"uncertainty.html"],
    ];

    // Build search UI as a string of HTML
    var searchHTML = '<div id="search-container" style="position:relative; margin-bottom:1.5rem;">' +
        '<input type="text" id="search-box" placeholder="Search concepts, methods, papers... (Ctrl+K)" ' +
        'style="width:100%; padding:0.75rem 1rem; border:2px solid #ddd; border-radius:8px; ' +
        'font-size:1rem; outline:none; box-sizing:border-box; background:#fff; color:#1a1a2e;">' +
        '<div id="search-results" style="display:none; position:absolute; top:100%; left:0; right:0; ' +
        'background:#fff; border:1px solid #ddd; border-radius:0 0 8px 8px; max-height:400px; ' +
        'overflow-y:auto; z-index:1000; box-shadow:0 4px 12px rgba(0,0,0,0.1);"></div>' +
        '</div>';

    // Find main-content and insert search at the top
    var main = document.querySelector('.main-content');
    if (main) {
        var temp = document.createElement('div');
        temp.innerHTML = searchHTML;
        var container = temp.firstChild;
        main.insertBefore(container, main.firstChild);
    }

    var searchBox = document.getElementById('search-box');
    var resultsDiv = document.getElementById('search-results');
    if (!searchBox || !resultsDiv) return;

    searchBox.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        if (!query) {
            resultsDiv.style.display = 'none';
            return;
        }

        var matches = [];
        for (var i = 0; i < searchIndex.length; i++) {
            var item = searchIndex[i];
            if (item[0].indexOf(query) !== -1 || item[1].toLowerCase().indexOf(query) !== -1) {
                matches.push(item);
                if (matches.length >= 10) break;
            }
        }

        if (matches.length === 0) {
            resultsDiv.innerHTML = '<div style="padding:0.75rem 1rem; color:#999;">No results found</div>';
        } else {
            var html = '';
            for (var j = 0; j < matches.length; j++) {
                var m = matches[j];
                html += '<a href="' + m[2] + '" style="display:block; padding:0.6rem 1rem; ' +
                    'text-decoration:none; color:#333; border-bottom:1px solid #eee;">' +
                    '<strong>' + m[0] + '</strong>' +
                    '<span style="display:block; font-size:0.8rem; color:#888;">' + m[1] + '</span></a>';
            }
            resultsDiv.innerHTML = html;
        }
        resultsDiv.style.display = 'block';
    });

    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        var container = document.getElementById('search-container');
        if (container && !container.contains(e.target)) {
            var res = document.getElementById('search-results');
            if (res) res.style.display = 'none';
        }
    });

    // Focus on Ctrl+K or Cmd+K
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            var sb = document.getElementById('search-box');
            if (sb) sb.focus();
        }
    });
})();
