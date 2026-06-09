const express = require("express");
const axios = require("axios");

const {
    TOKEN,
    WORK_COOLDOWN,
    DAILY_COOLDOWN
} = require("./config");

const {
    getUser,
    updateUser,
    getTopUsers
} = require("./database");