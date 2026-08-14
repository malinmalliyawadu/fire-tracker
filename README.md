# 🔥 FIRE Tracker

A comprehensive Financial Independence, Retire Early (FIRE) calculator and tracker built with React, TypeScript, and modern web technologies.

## Features

### 📊 Financial Tracking
- **Asset Management**: Track stocks, crypto, KiwiSaver, savings accounts, and more
- **Liability Tracking**: Monitor mortgages, loans, and other debts
- **Income & Savings Rate**: Gross pay in, tax worked out for you, and the savings rate that actually drives your FIRE date
- **Itemised Spending**: Expenses by category, with costs that stop or start at retirement
- **Multi-Currency Support**: Handle NZD and USD assets with automatic conversion
- **Actual vs Plan**: Compare recorded snapshots against the plan, and split growth into contributions versus market

### 🎯 FIRE Calculations
- **Traditional FIRE**: Calculate your standard FIRE target
- **Lean FIRE**: 60% of your FIRE target for minimal expenses
- **Fat FIRE**: 150% of your FIRE target for comfortable retirement
- **Coast FIRE**: Amount needed today to reach FIRE by retirement age
- **Time to FIRE**: Calculate years remaining based on current contributions

### 📈 Projections & Scenarios
- **Interactive Chart**: Visualize your journey to FIRE, in today's dollars
- **Saved Scenarios**: Pin a set of assumptions and overlay them on the chart to compare
- **Debt Payoff**: Loans amortise monthly at their own rate; repayments redirect into savings once a loan clears
- **Retirement Phase**: Model the withdrawal years, including any debt still being serviced

### 🇳🇿 New Zealand Specifics
- **Tax**: Progressive PAYE with the ACC earner levy, and investment tax by asset class — interest at your marginal rate, PIE funds and KiwiSaver under the Fair Dividend Rate at your PIR, property growth untaxed
- **KiwiSaver**: Contributions derived from salary, including the employer match net of ESCT and the government contribution
- **NZ Super**: Rates by living situation, offsetting retirement withdrawals from the eligibility age
- **KiwiSaver Lock**: A pot that compounds untouched and can't fund a retirement starting before the unlock age
- **Household**: A partner's NZ Super timed to their own age

### 🎯 Planning
- **Coast Date**: When you could stop contributing entirely and still arrive on time
- **Barista FIRE**: Part-time income bridging early retirement
- **Kids**: Per-child costs that follow an age curve, not a flat yearly figure
- **Life Events**: Dated one-off costs and windfalls
- **Spending Phases**: Optional go-go / slow-go / no-go multipliers across retirement
- **Assumption Checks**: Warnings when the numbers can't work — a withdrawal rate above your real return, a loan that never pays down
- **Backup & Restore**: Export everything as JSON or Markdown, and load a backup back in

### ⚙️ Advanced Features
- **Payment Frequencies**: Support for weekly, fortnightly, monthly, quarterly, and annual contributions
- **Realistic Modeling**: Separate interest rates for debts vs investment returns
- **Currency Conversion**: Automatic conversion between supported currencies
- **Net Worth History**: Snapshots recorded as you edit, charted over time

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: HeroUI (NextUI successor)
- **Styling**: TailwindCSS
- **State Management**: Zustand with localStorage persistence
- **Charts**: Recharts
- **Testing**: Vitest with jsdom
- **Development**: ESLint, Prettier, Hot reload

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/malinmalliyawadu/fire-tracker.git
cd fire-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test            # Run unit tests
npm run test:ui     # Run tests with UI interface

# Linting
npm run lint        # Run ESLint with auto-fix
```

## Usage

1. **Set Your Goals**: Configure your FIRE target, withdrawal rate, and expected returns in Settings
2. **Add Assets**: Input your current investments, savings, and other assets
3. **Track Liabilities**: Add mortgages, loans, and debts with accurate interest rates
4. **Monitor Progress**: View your progress towards FIRE with real-time calculations
5. **Analyze Projections**: Use the Simulate page to model different assumptions and save scenarios to compare
6. **Plan Your Journey**: Adjust contributions and see how it affects your timeline
7. **Export**: Produce a Markdown or JSON snapshot for backup or for pasting into an LLM

## Key Concepts

### FIRE Types
- **Traditional FIRE**: 25x annual expenses (4% withdrawal rule)
- **Lean FIRE**: Minimal expenses lifestyle (60% of traditional)
- **Fat FIRE**: Comfortable/luxury retirement (150% of traditional)
- **Coast FIRE**: Let compound interest do the work until retirement — the app reports both the amount needed today and the date you reach it

### Financial Modeling
Projections run in **today's dollars**, compounding at the real return (nominal return − inflation), so time-to-FIRE figures on every screen agree with the chart.

- **Debt**: Each liability amortises monthly at its own nominal rate. Before retirement, repayments are assumed to come from income (which the model does not track), so servicing a loan doesn't drain the portfolio — meaning net worth for someone carrying debt is **not** directly comparable to a debt-free run of the same inputs. Once a loan clears, its repayment is redirected into savings. After retirement, remaining debt service is withdrawn from the portfolio on top of living expenses.
- **Annual expenses** are treated as **excluding** loan repayments, since those are modelled separately from each liability's balance and rate.
- **Retirement Phase**: Withdrawals cover expenses, dependent kids, and any remaining debt service, less NZ Super once eligible.

#### Known limitations
- Returns are a single deterministic path — no Monte Carlo or sequence-of-returns risk.
- Net worth includes owner-occupied property, which compounds at the investment return and counts toward the FIRE target even though a home can't fund withdrawals.
- Tax rates and thresholds are hardcoded for one tax year in `src/domain/tax.ts` and need reviewing each April.
- Asset values are entered by hand; there is no live price feed.
- A partner's assets and income are pooled with yours — only their age is modelled separately.
- The layout is desktop-only; there is no mobile view yet.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

The project includes 156 unit tests covering:
- FIRE target calculations
- Numeric input parsing and formatting
- Projection modelling: debt amortisation, the KiwiSaver lock, kid cost curves, spending phases, one-off events, coast timing, and Barista income
- NZ tax: PAYE bands, the ACC cap, PIR and ESCT, and per-asset investment tax
- Backup parsing, including malformed and hostile input
- Plan tracking and assumption checks
- The exported snapshot

Run tests with `npm test` or use the UI with `npm run test:ui`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [HeroUI](https://heroui.com/) component library
- Inspired by the FIRE movement and financial independence principles
- Charts powered by [Recharts](https://recharts.org/)

---

**Start your journey to financial independence today! 🎯**