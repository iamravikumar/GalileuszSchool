﻿document.addEventListener('DOMContentLoaded', generateCalendar);

function generateCalendar() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        allDaySlot: false,
        hiddenDays: [0],
        slotMinTime: "08:00:00",
        slotMaxTime: "20:00:00",
        contentHeight: 625,
        selectable: true,
        editable: false,
        events: '/calendar/GetEvents',
        eventClick: function (info) {
            console.log(info.event);
            $('#editTitle').val(info.event.title);
            $('#editDescription').val(info.event.extendedProps.description);
            $('#editCourse').val(info.event.extendedProps.courseId);

            
            $('#deleteId').val(info.event.id);
            $('#attendanceEventId').val(info.event.id);
            $('#eventStartEdit').val(info.event.start.toISOString());
            $('#eventEndEdit').val(info.event.end.toISOString());
            getStudentByEvent(info.event.id);

            $('#editEvent').modal('show');
            

            //info.jsEvent.preventDefault();

            //if (info.event.url) {
            //    window.open(info.event.url);
            //} else {
            //    Swal.fire(info.event.title, 'Start: ' + info.event.start + ' End: ' + info.event.end, 'question');
            //}
        },
        select: function (info) {
            $('#createEvent').modal('show');
            $('#eventStart').val(info.startStr);
            $('#eventEnd').val(info.endStr);
            //calendar.fullCalendar("refetchEvents");  
        }
    });
    
    calendar.render();
}

//CREATE EVENT
$('#createNewEvent').on('click', function (e) {
    e.preventDefault();

    var data = {};
    $("#createEventform").serializeArray().map(function (x) { data[x.name] = x.value; }); 
    console.log(data);
    var mappedEvent = new Event(data);
    console.log(mappedEvent);

    $.ajax({
        url: "/calendar/create",
        data: mappedEvent,
        type: "post",
        //headers: {
        //    RequestVerificationToken:
        //        $('input:hidden[name="__RequestVerificationToken"]').val()
        //},
        success: function (res) {
            console.log(res);
            $('#createEvent').modal('hide');
            $('#createEvent').on('hidden.bs.modal', function () {
                $(this).find('form').trigger('reset');
                $(this).find('textarea').val('');
                generateCalendar();
            })
        }, error: function (res) {
            $('#createEvent').modal('hide');
            console.log(res);
        }
    });
});

//EDIT EVENT
$('#editEventBtn').on('click', function (e) {
    e.preventDefault();

    var data = {};
    $("#editEventform").serializeArray().map(function (x) { data[x.name] = x.value; });
    var mappedEvent = new Event(data);
    console.log(mappedEvent);

    $.ajax({
        url: "/calendar/edit",
        data: mappedEvent,
        type: "post",
        //headers: {
        //    RequestVerificationToken:
        //        $('input:hidden[name="__RequestVerificationToken"]').val()
        //},
        success: function (res) {
            console.log(res);
            $('#editEvent').modal('hide');
            $('#editEvent').on('hidden.bs.modal', function () {
                generateCalendar();
            })
        }, error: function (res) {
            $('#editEvent').modal('hide');
            console.log(res);
        }
    });
});

//DELETE EVENT
$('#deleteEvent').on('click', function (e) {
    e.preventDefault();
    var result = confirm("Are you sure ?");
    if (result) {
        var deleteId = $('#deleteId').val();
        $.ajax({
            url: "/calendar/delete",
            data: { id: deleteId },
            type: "post",
            success: function (res) {
                console.log(res);
                $('#editEvent').modal('hide');
                $('#editEvent').on('hidden.bs.modal', function () {
                    generateCalendar();
                })
            }, error: function (res) {
                $('#editEvent').modal('hide');
                console.log(res);
            }
        });
    }
 
});

//SAVE ATTENDANCE
$('#saveAttendance').on('click', function (e) {
    e.preventDefault();
    var data_arr = new Array();

    //instead it's possible to get value from checkboxes even if its not checked
    var serializedArray = $("#saveAttendanceFormId").serializeArray();
    console.log(serializedArray);

    if (serializedArray.length <= 2) {
        alert("Please just check present students otherwise leave it as it is.");
    } else {
        for (var i =2; i < serializedArray.length; i++) {
            var item = {};
            console.log(serializedArray[2].value);

            item['EventId'] = serializedArray[0].value;
            item['StudentId'] = serializedArray[i].name.substring(9);
            item['IsPresent'] = serializedArray[i].value === "on" ? true : false;

            data_arr.push(item);
        }
    }
    saveAttendance(data_arr);
});

function saveAttendance(dataArr) {
    $.ajax({
        url: "/calendar/CheckAttendance",
        data: { attendanceForms: dataArr },
        type: "post",
        success: function (res) {
            console.log(res);
            $('#editEvent').modal('hide');

        }, error: function (res) {
            $('#editEvent').modal('hide');
            console.log(res);
        }
    });
}

function getStudentByEvent(eventId) {

    $.ajax({
        url: "/calendar/GetStudentsByEvent",
        data: { eventId: eventId },
        type: "get",
        success: function (res) {
            console.log(res);
            $.each(res, function (index, value) {
                var fullName = value.student.firstName + " " + value.student.lastName;


                //bad practice make it better
                var htmlPart = "<div class=" + "'row form-row'" + "><div class=" + "'col'" + ">" +
                    "<label class=" + "'form-check-label'" + " for=" +"'"+ fullName + "Id" +"'" + ">" + fullName + "</label></div>" +
                    "<div class=" + "'col-right'" + ">" +
                    "<input type=" + "'checkbox'" + " class=" + "'form-check-input'" + " id=" + "'" + fullName + "Id" + "'" + " name=" + "'" + "isPresent" + value.student.id +"'" + 
                    " data-studentid=" +"'" + value.student.id + "'" + " ></div ></div > ";
                $('#saveAttendanceFormId').append($(htmlPart));
            })
            
        }, error: function (res) {
            console.log(res);
        }
    });
}


//EVENT MODEL
function Event(data) {
    console.log(data);
    this.Id = data.id;
    this.Title = data.title;
    this.Description = data.description;
    this.Start = data.start;
    this.End = data.end;
    this.CourseId = data.course;
}    
