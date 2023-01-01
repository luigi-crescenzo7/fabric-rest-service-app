class IdCard {
    //TODO: togliere alcune proprietà..
    key;
    cardNumber;
    name;
    surname;
    sex;
    dateOfBirth;
    placeOfBirth;
    //
    height;
    //
    issuing;
    nationality;
    expiryDate;
    //
    municipality;
    fiscalCode;
    //
    residence;
    ownerId;


    constructor(id, cardNumber, name, surname,
        sex, dateOfBirth, placeOfBirth, nationality,
        expiryDate, fiscalCode, ownerId) {

        this.key = id;
        this.cardNumber = cardNumber;
        this.name = name;
        this.surname = surname;
        this.sex = sex;
        this.dateOfBirth = dateOfBirth;
        this.placeOfBirth = placeOfBirth;
        //this.heigth = heigth;
        //this.issuing = issuing;
        this.nationality = nationality;
        this.expiryDate = expiryDate;
        //this.municipality = municipality;
        this.fiscalCode = fiscalCode;
        //this.residence = residence;
        this.ownerId = ownerId;


    }

    get key() {
        return this.key;
    }
    set key(value) {
        this.key = value;
    }

    get cardNumber() {
        return this.cardNumber;
    }
    set cardNumber(value) {
        this.cardNumber = value;
    }
    get name() {
        return this.name;
    }
    set name(value) {
        this.name = value;
    }
    get surname() {
        return this.surname;
    }
    set surname(value) {
        this.surname = value;
    }
    get sex() {
        return this.sex;
    }
    set sex(value) {
        this.sex = value;
    }
    get dateOfBirth() {
        return this.dateOfBirth;
    }
    set dateOfBirth(value) {
        this.dateOfBirth = value;
    }
    get placeOfBirth() {
        return this.placeOfBirth;
    }
    set placeOfBirth(value) {
        this.placeOfBirth = value;
    }
    /*
    get height() {
        return this.
        height;
    }
    set height(value) {
        this.
        height = value;
    }*/
    get issuing() {
        return this.issuing;
    }
    set issuing(value) {
        this.issuing = value;
    }
    get nationality() {
        return this.nationality;
    }
    set nationality(value) {
        this.nationality = value;
    }
    get expiryDate() {
        return this.expiryDate;
    }
    set expiryDate(value) {
        this.expiryDate = value;
    }
    get municipality() {
        return this.municipality;
    }
    set municipality(value) {
        this.municipality = value;
    }
    get fiscalCode() {
        return this.fiscalCode;
    }
    set fiscalCode(value) {
        this.iscalCode = value;
    }
    get residence() {
        return this.residence;
    }
    set residence(value) {
        this.residence = value;
    }
    get ownerId() {
        return this.ownerId;
    }
    set ownerId(value) {
        this.ownerId = value;
    }
}


IdCard.prototype.toString = function toString() { return `IdCard[${this.id}, ${this.name}, ${this.ownerId}]`; }
module.exports = IdCard