// ============================================================================
// COST CALCULATOR - Real-time cost estimation
// ============================================================================

const CostCalculator = {
    calculateResumeGenerationCost(provider, mode, count = 1) {
        const baseCost = AIIntegration.getCost(provider, mode);
        return {
            perResume: baseCost,
            totalCost: baseCost * count,
            count: count,
            provider: provider,
            mode: mode,
            breakdown: {
                aiTailoring: baseCost * 0.6,
                documentGeneration: baseCost * 0.3,
                portfolioGeneration: baseCost * 0.1
            }
        };
    },
    
    estimateProjectCost(generations) {
        let total = 0;
        const byProvider = {};
        const byMode = {};
        
        for (const gen of generations) {
            const cost = AIIntegration.getCost(gen.provider, gen.mode);
            total += cost * (gen.count || 1);
            
            if (!byProvider[gen.provider]) {
                byProvider[gen.provider] = 0;
            }
            byProvider[gen.provider] += cost * (gen.count || 1);
            
            if (!byMode[gen.mode]) {
                byMode[gen.mode] = 0;
            }
            byMode[gen.mode] += cost * (gen.count || 1);
        }
        
        return {
            total: total.toFixed(4),
            byProvider: byProvider,
            byMode: byMode,
            formatted: `$${total.toFixed(2)}`
        };
    },
    
    compareCosts(count = 1) {
        const comparison = {};
        
        for (const provider in AIIntegration.providers) {
            comparison[provider] = {
                name: AIIntegration.providers[provider].name,
                fast: (AIIntegration.getCost(provider, 'fast') * count).toFixed(4),
                smart: (AIIntegration.getCost(provider, 'smart') * count).toFixed(4),
                ultra: (AIIntegration.getCost(provider, 'ultra') * count).toFixed(4)
            };
        }
        
        return comparison;
    },
    
    getSavingsAdvice(provider, mode, count = 1) {
        const currentCost = AIIntegration.getCost(provider, mode) * count;
        const cheapest = this.findCheapestOption(mode, count);
        
        if (cheapest.cost < currentCost) {
            const savings = currentCost - cheapest.cost;
            const savingsPercent = ((savings / currentCost) * 100).toFixed(0);
            
            return {
                canSave: true,
                savings: savings.toFixed(4),
                savingsPercent: savingsPercent,
                recommendation: `Switch to ${cheapest.provider} (${AIIntegration.providers[cheapest.provider].name}) to save $${savings.toFixed(2)} (${savingsPercent}%)`
            };
        }
        
        return { canSave: false };
    },
    
    findCheapestOption(mode, count = 1) {
        let cheapest = null;
        let minCost = Infinity;
        
        for (const provider in AIIntegration.providers) {
            const cost = AIIntegration.getCost(provider, mode) * count;
            if (cost < minCost) {
                minCost = cost;
                cheapest = { provider, cost };
            }
        }
        
        return cheapest;
    },
    
    creditWorth(availableCredits = 100) {
        const comparison = {};
        
        for (const provider in AIIntegration.providers) {
            comparison[provider] = {
                name: AIIntegration.providers[provider].name,
                fast: Math.floor(availableCredits / AIIntegration.getCost(provider, 'fast')),
                smart: Math.floor(availableCredits / AIIntegration.getCost(provider, 'smart')),
                ultra: Math.floor(availableCredits / AIIntegration.getCost(provider, 'ultra'))
            };
        }
        
        return comparison;
    }
};

window.CostCalculator = CostCalculator;
console.log('CostCalculator initialized');

} // End of guard

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostCalculator;
}
