1. Turn the current sign-in page into a proper landing page, which should show:
[Features]
- get a clear overview of your wealth status and asset structure
- track your wealth changes over time
- predict your future wealth growth and gain insights in how/when to hit your financial goal
[Get started]
- Login with google
- Continue without login

2. Use without login (i.e. guest mode)
If user chooses this, tell the user that the records will be saved in browser's local storage.
If user later logs in after records have been created, auto save the records into DB

3. In the 'Financial Goal' section
allow user to set the goal in two different ways: 
- target total wealth
- financial freedom

If target total wealth is chosen, use the existing form
If financial freedom is chosen, let user input his yearly expense, and calculate starting from when his passive income (i.e. wealth growth within a year) can cover his expense. Note that we need to take into account the fact the expense will grow every year with inflation. Use some conservative estimate of future inflation rate for this calculation.