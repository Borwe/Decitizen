# Decitizen

## Goal
A way to validate a Kenyan using ID, First Name, and Year of birth.

## Requirements
- Node or Bun

## Building
- Clone This repo
- Enter the directory you cloned into
```bash
cd Decitizen
```

- Install the libraries
```bash
npm i
```

- Run (Currently server not implemented yet)
```bash
npm run server
```

## Testing
- Make a copy of the `.env.copy` file and rename it to `.env`
- Run `npm install` to install the dependencies
- Inside the `.env` file you created you will notice 4 set group of values separated by white space.
    - The first one should be replaced with real life values that are correct.
    - Second one should have the Name(first value) with a wrong one.
        - Please note, there is a bug on ecitizen, as it checks if the real name associated with the id, and passes, eg: If you give a fake name "Brianss", but your real name is "Brian" it would pass, they might fix this bug later on.
    - Third One should have the year(date of birth) field wrong
    - Last one should have ID wrong
    - NOTE: The `.env.copy` file contains fake data, please replace it accordingly with the advice above.
- Run `npm run test` and tests should all pass.
- NOTE: Since I had no real data of any user who hasn't yet registered to eCitizen, some fails should be taken as the user hasn't created an ecitizen account as we do not yet check for that case.

## Contributions.
Contributions are open and encouraged, spot any bug send an issue or just create a pull request, have any questions? You can also just post that on the issue tracker.

## License
MIT License

## Author
Me, Brian Orwe.


